import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject, timer } from 'rxjs';
import { DeviceService } from './device.service';
import { IConnectionProvider, ProviderType } from './interfaces/connection-provider';
import { LoggerService } from './logger.service';
import { Device } from './primitives/device';
import { ConnectionState, State } from './primitives/state';
import { toBehaviourSubject } from '../utils/transformers';

declare const cordova: any;
declare const navigator: any;

@Injectable()
export class BluetoothService implements IConnectionProvider {
  public deviceState = new BehaviorSubject<State>(State.Stopped);
  public connectionState = new BehaviorSubject<ConnectionState>(ConnectionState.None);

  public searchState = new BehaviorSubject<State>(State.Stopped);
  public discoveryState = new BehaviorSubject<State>(State.Stopped);

  public serverState = new BehaviorSubject<State>(State.Stopped);
  public listeningState = new BehaviorSubject<State>(State.Stopped);

  public serverReady = toBehaviourSubject(
    combineLatest([
      this.listeningState,
      this.serverState
    ], (discoveryState, serverState) => {
      if (discoveryState === serverState) {
        return serverState;
      } else if ([discoveryState, serverState].some(v => v === State.Starting)) {
        return State.Starting;
      } else if ([discoveryState, serverState].some(v => v === State.Stopping)) {
        return State.Stopping;
      } else {
        return State.Starting;
      }
    }),
    State.Stopped
  );

  public devices = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());
  public connectedDevice = new BehaviorSubject<Device>(null);

  public message: Subject<string> = new Subject<string>();

  private plugin = null;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly ngZone: NgZone
  ) {
    this.deviceService.deviceReady().then(() => {
      this.plugin = cordova.plugins.bluetooth;

      this.plugin.setStateCallback(state => {
        this.deviceState.next(state);
      });

      this.plugin.setConnectedCallback(device => this.ngZone.run(async () => {
        if (device !== null) {
          await this.plugin.startReading();
          this.connectedDevice.next(new Device(ProviderType.BLUETOOTH, device.name, device.address, null, true));
          this.connectionState.next(ConnectionState.Connected);
        } else {
          this.connectedDevice.next(null);
          this.connectionState.next(ConnectionState.None);
        }
      }));

      this.plugin.setDiscoveredCallback(device => this.ngZone.run(() => {
        const devices = this.devices.getValue();

        let deviceEntry = new Device(ProviderType.BLUETOOTH, device.name, device.address);

        if (devices.has(device.address)) {
          deviceEntry = deviceEntry.merge(devices.get(device.address));
        }

        devices.set(device.address, deviceEntry);

        this.devices.next(devices);
      }));

      this.plugin.setDiscoveryCallback(discovery => this.ngZone.run(() => {
        this.searchState.next(discovery ? State.Started : State.Stopped);
      }));

      this.plugin.setListeningCallback(listening => this.ngZone.run(() => {
        this.listeningState.next(listening ? State.Started : State.Stopped);
      }));

      this.plugin.setDiscoverableCallback(discoverable => this.ngZone.run(() => {
        this.discoveryState.next(discoverable ? State.Started : State.Stopped);
      }));

      this.plugin.setMessageCallback(message => this.ngZone.run(() => {
        this.message.next(message);
      }));

      this.plugin.getState().then(state => this.ngZone.run(() => {
        this.deviceState.next(state);
      }));

      this.plugin.getListening().then(listening => this.ngZone.run(() => {
        this.listeningState.next(listening ? State.Started : State.Stopped);
      }));

      this.plugin.getDiscoverable().then(discoverable => this.ngZone.run(() => {
        this.discoveryState.next(discoverable ? State.Started : State.Stopped);
      }));
    });
  }

  public async reset() {
    await Promise.all([
      this.disconnect(),
      this.stopListening()
    ]);
  }

  async startServer() {
    if (this.serverState.getValue() !== State.Stopped) {
      console.log('Trying to start server while still not finised');
      return;
    }

    this.serverState.next(State.Started);
  }

  async stopServer() {
    if (this.serverState.getValue() !== State.Started) {
      console.log('Trying to stop server while still not started');
      return;
    }

    this.serverState.next(State.Stopping);

    try {
      if (this.listeningState.getValue() === State.Started) {
        await this.stopListening();
      }
      this.serverState.next(State.Stopped);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to stop server', e);
      this.serverState.next(State.Started);
      throw e;
    }
  }

  async startListening() {
    if (this.serverState.getValue() !== State.Started) {
      console.log('Cannot start listening with stopped server');
      return;
    }

    if (this.listeningState.getValue() !== State.Stopped) {
      console.log('Trying to start listening while still not finised');
      return;
    }

    this.listeningState.next(State.Starting);

    try {
      await this.plugin.startListening();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start listening', e);
      this.listeningState.next(State.Stopped);
      throw e;
    }
  }

  async stopListening() {
    if (this.listeningState.getValue() !== State.Started) {
      console.log('Trying to stop listening while still not started');
      return;
    }

    this.listeningState.next(State.Stopping);

    try {
      await this.plugin.stopListening();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to stop listening', e);
      this.listeningState.next(State.Started);
      throw e;
    }
  }

  async connect(device: Device) {
    if (this.connectionState.getValue() !== ConnectionState.None) {
      console.log('Trying to connect while not disconnected');
      return;
    }

    this.connectionState.next(ConnectionState.Connecting);

    try {
      await this.plugin.connect({name: device.name, address: device.macAddress});
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to connect', e);
      this.connectionState.next(ConnectionState.None);
      throw e;
    }
  }

  async disconnect() {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      console.log('Trying to disconnect while not connected');
      return;
    }

    try {
      await this.plugin.disconnect();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to disconnect bluetooth devices', e);
      throw e;
    }
  }

  async send(message: string) {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      console.log('Trying to send while not connected');
      return;
    }

    try {
      await this.plugin.write(message);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to send message to a bluetooth device', e);
      throw e;
    }
  }

  async searchDevices(duration: number) {
    if (this.searchState.getValue() !== State.Stopped) {
      console.log('Trying to atsrt search while not finished');
      return;
    }

    this.searchState.next(State.Starting);

    const paired = await this.plugin.listPairedDevices();
    const mapped = new Map<string, Device>();
    for (const device of paired) {
      if (device.hasOwnProperty('address')) {
        mapped.set(device.address, new Device(ProviderType.BLUETOOTH, device.name, device.address, null, true));
      }
    }

    this.devices.next(mapped);

    try {
      await this.plugin.startDiscovery();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start discovery', e);
      this.searchState.next(State.Stopped);
      throw e;
    }

    await timer(duration).toPromise();

    this.searchState.next(State.Stopping);

    try {
      await this.plugin.cancelDiscovery();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to cancel discovery', e);
      this.searchState.next(State.Started);
      throw e;
    }
  }

  async enableDiscovery() {
    await this.plugin.enableDiscovery();
  }

  async enable() {
    if (this.deviceState.getValue() !== State.Stopped) {
      console.log('Trying to enable enabled BT');
      return;
    }

    this.deviceState.next(State.Starting);

    try {
      await this.plugin.enable();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to enable BT', e);
      this.deviceState.next(State.Stopped);
      throw e;
    }
  }
}
