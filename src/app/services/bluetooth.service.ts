import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import { requestDialog } from '../utils/dialog';
import { toBehaviourSubject } from '../utils/transformers';
import { ProviderType } from './connection-provider';
import { DeviceService } from './device.service';
import { IConnectionProvider } from './interfaces/i-connectivity-provider';
import { LoggerService } from './logger.service';
import { Device, equals } from './primitives/device';
import { ConnectionState, State } from './primitives/state';

declare const cordova: any;
declare const navigator: any;

@Injectable()
export class BluetoothService implements IConnectionProvider {

  public toggled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public enabling: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.Starting)), false);
  public enabled: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.Started)), false);
  public enabledChanged: Observable<boolean> = this.enabled.pipe(distinctUntilChanged(), skip(1));
  public enabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => enabled), mapTo(null));
  public disabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => !enabled), mapTo(null));

  public connectionState: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);
  public connectionStateChanged: Observable<ConnectionState> = this.connectionState.pipe(distinctUntilChanged(), skip(1));
  public connected: BehaviorSubject<boolean> = toBehaviourSubject(
    this.connectionState.pipe(
      map(state => state === ConnectionState.Connected)
    ), false);
  public connectedChanged: Observable<boolean> = this.connected.pipe(distinctUntilChanged(), skip(1));
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  public discovering: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public discoveringChanged: Observable<boolean> = this.discovering.pipe(distinctUntilChanged(), skip(1));
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => discovering), mapTo(null));
  public discoveryFinishedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => !discovering), mapTo(null));

  public discoverable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public discoverableChanged: Observable<boolean> = this.discoverable.pipe(distinctUntilChanged(), skip(1));
  public discoverableStartedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => discoverable), mapTo(null));
  public discoverableFinishedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => !discoverable), mapTo(null));

  public listeningState: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public stopped: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Stopped)), false);
  public starting: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Starting)), false);
  public stopping: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Stopping)), false);
  public listening: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Started)), false);
  public listeningChanged: Observable<boolean> = this.listening.pipe(distinctUntilChanged(), skip(1));
  public listeningStartedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => listening), mapTo(null));
  public listeningStoppedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => !listening), mapTo(null));

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());
  public devicesChanged: Observable<Map<string, Device>> = this.devices.pipe(
    distinctUntilChanged(equals),
    skip(1));

  public connectedDevices: BehaviorSubject<Array<Device>> = new BehaviorSubject<Array<Device>>(new Array<Device>());

  public message: Subject<string> = new Subject<string>();

  private refreshDevicesEvent = new Subject<any>();

  private deviceRelatedChange = merge(
    this.refreshDevicesEvent,
    this.enabled.pipe(filter(enabled => enabled)),
    this.connected,
    this.discovering
  );

  constructor(private readonly deviceService: DeviceService,
              private readonly ngZone: NgZone) {
    this.init();
  }

  async toggleProvider() {
    if (this.state.getValue() === State.Stopped) {
      await this.openRequestBluetoothDialog();
    } else if (this.state.getValue() === State.Started && this.listeningState.getValue() === State.Stopped) {
      this.toggled.next(true);
      await this.startListening();
    } else {
      await this.stopListening();
    }
  }

  public refreshDevices() {
    this.refreshDevicesEvent.next();
  }

  async startListening() {
    if (this.listeningState.getValue() !== State.Stopped) {
      return;
    }

    this.listeningState.next(State.Starting);

    try {
      await cordova.plugins.bluetooth.startListening();
      this.listeningState.next(State.Started);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start listening', e);
      this.listeningState.next(State.Stopped);
      throw e;
    }
  }

  async stopListening() {
    if (this.listeningState.getValue() !== State.Started) {
      return;
    }

    this.listeningState.next(State.Stopping);

    try {
      this.toggled.next(false);
      await cordova.plugins.bluetooth.stopListening();
      this.listeningState.next(State.Stopped);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start listening', e);
      this.listeningState.next(State.Started);
      this.toggled.next(true);
      throw e;
    }
  }

  async stopServiceListening() {
    await this.stopListening();
  }

  async connect(device: Device) {
    if (this.connectionState.getValue() !== ConnectionState.None) {
      return;
    }

    if (device.macAddress != null) {
      this.connectionState.next(ConnectionState.Connecting);

      try {
        await cordova.plugins.bluetooth.connect({name: device.name, address: device.macAddress});
        this.connectedDevices.getValue().push(device);
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to connect', e);
        this.connectionState.next(ConnectionState.None);
        throw e;
      }
    }
  }

  async disconnect() {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      return;
    }

    try {
      await cordova.plugins.bluetooth.disconnect();
      this.connectedDevices.next(new Array<Device>());
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to disconnect bluetooth devices', e);
      throw e;
    }
  }

  async send(message) {
    try {
      await cordova.plugins.bluetooth.write(JSON.stringify(message));
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to send message to a bluetooth device', e);
      throw e;
    }
  }

  async searchDevices(duration: number) {
    if (this.discovering.getValue()) {
      return;
    }

    const paired = await cordova.plugins.bluetooth.listPairedDevices();
    const mapped = new Map<string, Device>();
    for (const device of paired) {
      if (device.hasOwnProperty('name')) {
        mapped.set(device.name, new Device(ProviderType.BLUETOOTH, device.name, device.address, null, true));
      }
    }

    this.devices.next(mapped);

    try {
      await cordova.plugins.bluetooth.startDiscovery();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start discovery', e);
      throw e;
    }
  }

  async cancelDiscovery() {
    await cordova.plugins.bluetooth.cancelDiscovery();
  }

  async enableDiscovery() {
    await cordova.plugins.bluetooth.enableDiscovery();
  }

  async openRequestBluetoothDialog() {
    if (this.state.getValue() !== State.Stopped) {
      return;
    }

    if (await requestDialog('An app wants to turn on Bluetooth')) {
      this.toggled.next(true);
      await cordova.plugins.bluetooth.enable();
    }
  }

  private async init() {
    await this.deviceService.deviceReady();

    this.deviceRelatedChange.subscribe(() => this.ngZone.run(async () => {
      if (this.enabled.getValue()) {
        const paired = await cordova.plugins.bluetooth.listPairedDevices();

        const mapped = new Map<string, Device>();
        for (const device of paired) {
          if (device.hasOwnProperty('name')) {
            mapped.set(device.name, new Device(ProviderType.BLUETOOTH, device.name, device.address, null, true));
          }
        }
        this.devices.next(mapped);
      }
    }));

    this.discoveryStartedEvent.subscribe(() => this.devices.next(new Map<string, Device>()));

    cordova.plugins.bluetooth.setConnectedCallback((device) => this.ngZone.run(async () => {
      if (device !== null) {
        this.connectedDevices.getValue().push(new Device(ProviderType.BLUETOOTH, device.name, device.address, null, true));
        this.connectionState.next(ConnectionState.Connected);
        await cordova.plugins.bluetooth.startReading();
      } else {
        this.connectionState.next(ConnectionState.None);
      }
    }));

    cordova.plugins.bluetooth.setDiscoveredCallback((device) => this.ngZone.run(() => {
      const devices = this.devices.getValue();
      if (devices.has(device.name)) {
        if (devices.get(device.name).macAddress === device.address) {
          return;
        }
      }

      devices.set(device.name, new Device(ProviderType.BLUETOOTH, device.name, device.address));
      this.devices.next(devices);
    }));

    cordova.plugins.bluetooth.setDiscoveryCallback((discovery) => this.ngZone.run(() => {
      this.discovering.next(discovery);
    }));

    cordova.plugins.bluetooth.setMessageCallback((message) => this.ngZone.run(() => {
      this.message.next(JSON.parse(message));
    }));

    cordova.plugins.bluetooth.setDiscoverableCallback((discoverable) => this.ngZone.run(() => {
      this.discoverable.next(discoverable);
    }));

    cordova.plugins.bluetooth.getDiscoverable().then((discoverable) => this.ngZone.run(() => {
      this.discoverable.next(discoverable);
    }));

    cordova.plugins.bluetooth.setStateCallback((state) => this.ngZone.run(() => {
      this.state.next(state);
    }));

    cordova.plugins.bluetooth.getState().then((state) => this.ngZone.run(() => {
      this.state.next(state);
    }));
  }
}
