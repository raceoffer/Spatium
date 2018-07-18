import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, interval, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { toBehaviourSubject, toReplaySubject } from '../utils/transformers';
import { DeviceService } from './device.service';
import { DiscoveryService } from './discovery.service';
import { IConnectionProvider } from './interfaces/connection-provider';
import { Device } from './primitives/device';
import { ConnectionState, State } from './primitives/state';
import { SocketClientService } from './socketclient.service';
import { SocketServerService } from './socketserver.service';

declare const cordova;
declare const navigator;

@Injectable()
export class ZeroconfService implements IConnectionProvider {
  public deviceState = new BehaviorSubject<State>(State.Stopped);

  public connectionState = toBehaviourSubject(
    combineLatest([
      this.socketClientService.state,
      this.socketServerService.connectionState
    ], (clientState, serverState) => {
      if ([clientState, serverState].some(v => v === ConnectionState.Connected)) {
        return ConnectionState.Connected;
      } else if ([clientState, serverState].some(v => v === ConnectionState.Connecting)) {
        return ConnectionState.Connecting;
      } else {
        return ConnectionState.None;
      }
    }),
    ConnectionState.None
  );

  public serverState = this.socketServerService.state;
  public listeningState = this.discoveryService.advertising;

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

  public searchState = this.discoveryService.discovering;
  public discoveryState = this.discoveryService.advertising;

  public devices = this.discoveryService.devices;

  public connectedDevice = toBehaviourSubject(combineLatest([
    this.socketServerService.connectedDevice,
    this.socketClientService.connectedDevice
  ]).pipe(
    map(([serverDevice, clientDevice]) => {
      // Just for the case of unambiguity we prefer the client
      if (clientDevice !== null) {
        return clientDevice;
      } else {
        return serverDevice;
      }
    })
  ), null);

  public message = toReplaySubject(merge(
    this.socketClientService.message,
    // in order to prevent a mess we ignore messages to the server while the client is connected
    this.socketServerService.message.pipe(filter(_ => this.socketClientService.state.getValue() !== ConnectionState.Connected))
  ), 1);

  private refreshTimer = interval(500);

  constructor(
    private readonly socketClientService: SocketClientService,
    private readonly socketServerService: SocketServerService,
    private readonly discoveryService: DiscoveryService,
    private readonly deviceService: DeviceService
  ) {
    this.deviceService.deviceReady().then(() => {
      this.refreshTimer.subscribe(async () => {
        try {
          if (await this.checkWiFiState()) {
            if (navigator.connection.type === 'wifi') {
              this.deviceState.next(State.Started);
            } else {
              this.deviceState.next(State.Starting);
            }
          } else {
            this.deviceState.next(State.Stopped);
          }
        } catch (error) {
          console.error('The following error occurred: ' + error);
          this.deviceState.next(State.Stopped);
        }
      });
    });
  }

  public async reset() {
    await Promise.all([
      this.disconnect(),
      this.stopListening()
    ]);
  }

  public async startServer() {
    await this.socketServerService.start();
  }

  public async stopServer() {
    await Promise.all([
      this.socketServerService.stop(),
      await this.discoveryService.stopAdvertising()
    ]);
  }

  public async startListening() {
    if (this.serverState.getValue() !== State.Started) {
      console.log('Cannot start listening with stopped server');
      return;
    }

    if (this.listeningState.getValue() !== State.Stopped) {
      console.log('Failed to start listening while still listening');
      return;
    }

    await this.discoveryService.startAdvertising();
  }

  public async stopListening() {
    if (this.listeningState.getValue() !== State.Started) {
      console.log('Failed to stop listening while not listening');
      return;
    }

    await this.discoveryService.stopAdvertising();
  }

  // Client interface

  public async searchDevices(duration: number) {
    await this.discoveryService.searchDevices(duration);
  }

  public async connect(device: Device) {
    if (device.ip != null) {
      await this.socketClientService.connect(device);
    }
  }

  // Mixed interface

  public disconnect(): void {
    // we assume that services perform noop if not connected
    this.socketClientService.disconnect();
    this.socketServerService.disconnect();
  }

  public send(message: any): void {
    // in order to prevent a mess we always send messages to the server if it's connected
    if (this.socketServerService.connectionState.getValue() === ConnectionState.Connected) {
      this.socketServerService.send(message);
    } else {
      this.socketClientService.send(message);
    }
  }

  public async enable() {
    await this.setWiFiState(true);
  }

  async cancelDiscovery() {}

  async enableDiscovery() {}

  private async checkWiFiState() {
    return await new Promise<boolean>((resolve, reject) => {
      cordova.plugins.diagnostic.isWifiAvailable(
        available => resolve(available as boolean),
        reject
      );
    });
  }

  private async setWiFiState(state: boolean) {
    return await new Promise<any>((resolve, reject) => {
      cordova.plugins.diagnostic.setWifiState(
        resolve,
        reject,
        state
      );
    });
  }
}
