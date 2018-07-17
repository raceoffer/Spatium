import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, interval, merge } from 'rxjs';
import { distinctUntilChanged, filter, skip, take } from 'rxjs/operators';
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
  public state = new BehaviorSubject<State>(State.Stopped);

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

  public listeningState = toBehaviourSubject(
    combineLatest([
      this.discoveryService.advertising,
      this.socketServerService.state
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

  public connectedDevice = new BehaviorSubject<Device>(null);

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
              this.state.next(State.Started);
            } else {
              this.state.next(State.Starting);
            }
          } else {
            this.state.next(State.Stopped);
          }
        } catch (error) {
          console.error('The following error occurred: ' + error);
          this.state.next(State.Stopped);
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


  public async startListening() {
    await Promise.all([
      this.socketServerService.start(),
      this.discoveryService.startAdvertising()
    ]);
  }

  public async stopListening() {
    await Promise.all([
      this.socketServerService.stop(),
      this.discoveryService.stopAdvertising()
    ]);
  }

  // Client interface

  public async searchDevices(duration: number) {
    await this.discoveryService.searchDevices(duration);
  }

  public async connect(device: Device) {
    if (device.ip != null) {
      this.socketClientService.connect(device.ip);

      const result = await this.socketClientService.state.pipe(
        distinctUntilChanged(),
        skip(1),
        filter(state => state !== ConnectionState.Connecting),
        take(1)
      ).toPromise();

      if (result === ConnectionState.Connected) {
        this.connectedDevice.next(device);
      }
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
      cordova.plugins.diagnostic.isWifiEnabled(
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
