import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip, take } from 'rxjs/operators';
import { requestDialog } from '../utils/dialog';
import { toBehaviourSubject, toReplaySubject } from '../utils/transformers';
import { DiscoveryService } from './discovery.service';
import { IConnectionProvider } from './interfaces/i-connectivity-provider';
import { Device, equals } from './primitives/device';
import { ConnectionState, State } from './primitives/state';
import { SocketClientService } from './socketclient.service';
import { SocketServerService } from './socketserver.service';

declare const cordova;
declare const navigator;

@Injectable()
export class ConnectivityService implements IConnectionProvider {

  public toggled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public enabling: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.Starting)), false);
  public enabled: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.Started)), false);
  public enabledChanged: Observable<boolean> = this.enabled.pipe(distinctUntilChanged(), skip(1));
  public enabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => enabled), mapTo(null));
  public disabledEvent: Observable<any> = this.enabledChanged.pipe(filter(enabled => !enabled), mapTo(null));

  public connectionState: BehaviorSubject<ConnectionState> = toBehaviourSubject(
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
  public connectionStateChanged: Observable<ConnectionState> = this.connectionState.pipe(distinctUntilChanged(), skip(1));

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(
    this.connectionState.pipe(map(state => state === ConnectionState.Connected)), false);
  public connectedChanged: Observable<any> = this.connected.pipe(distinctUntilChanged(), skip(1));
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  public listeningState: BehaviorSubject<State> = toBehaviourSubject(
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
  public stopped: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Stopped)), false);
  public starting: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Starting)), false);
  public startingChanged: Observable<any> = this.starting.pipe(distinctUntilChanged(), skip(1));
  public startingStoppedEvent: Observable<any> = this.startingChanged.pipe(filter(starting => !starting), mapTo(null));
  public stopping: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Stopping)), false);
  public listening: BehaviorSubject<boolean> = toBehaviourSubject(this.listeningState.pipe(map(state => state === State.Started)), false);
  public listeningChanged: Observable<any> = this.listening.pipe(distinctUntilChanged(), skip(1));
  public listeningStartedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => listening), mapTo(null));
  public listeningStoppedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => !listening), mapTo(null));

  public discoveryState: BehaviorSubject<State> = this.discoveryService.discovering;
  public discovering: BehaviorSubject<boolean> = toBehaviourSubject(
    this.discoveryState.pipe(map(state => state === State.Started)), false);
  public discoveringChanged: Observable<any> = this.discovering.pipe(distinctUntilChanged(), skip(1));
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => discovering), mapTo(null));
  public discoveryFinishedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => !discovering), mapTo(null));

  public discoverableState: BehaviorSubject<State> = this.discoveryService.advertising;
  public discoverable: BehaviorSubject<boolean> = toBehaviourSubject(
    this.discoverableState.pipe(map(state => state === State.Started)), false);
  public discoverableChanged: Observable<boolean> = this.discoverable.pipe(distinctUntilChanged(), skip(1));
  public discoverableStartedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => discoverable), mapTo(null));
  public discoverableFinishedEvent: Observable<any> = this.discoverableChanged.pipe(filter(discoverable => !discoverable), mapTo(null));

  public devices = this.discoveryService.devices;
  public devicesChanged: Observable<Map<string, Device>> = this.devices.pipe(
    distinctUntilChanged(equals),
    skip(1));
  public connectedDevices: BehaviorSubject<Array<Device>> = new BehaviorSubject<Array<Device>>(new Array<Device>());

  public message = toReplaySubject(merge(
    this.socketClientService.message,
    // in order to prevent a mess we ignore messages to the server while the client is connected
    this.socketServerService.message.pipe(filter(_ => !this.socketClientService.connected.getValue()))
  ), 1);

  timer: any;

  constructor(private readonly ngZone: NgZone,
              private readonly socketClientService: SocketClientService,
              private readonly socketServerService: SocketServerService,
              private readonly discoveryService: DiscoveryService) {
    this.init();
  }

  // Server interface

  public async toggleProvider() {
    if (!this.listening.getValue() && !this.toggled.getValue()) {
      if (this.enabled.getValue() || this.enabling.getValue()) {
        this.toggled.next(true);
        if (this.enabled.getValue()) {
          await this.startListening();
        }
      } else {
        if (this.state.getValue() !== State.Stopped) {
          return;
        }

        if (await requestDialog('An app wants to turn on WiFi')) {
          this.toggled.next(true);
          cordova.plugins.diagnostic.setWifiState(() => {
            console.log('Wifi was enabled');
          }, (error) => {
            console.error('The following error occurred: ' + error);
            this.toggled.next(false);
          }, true);
        }
      }
    } else {
      this.toggled.next(false);
      await this.stopListening();
    }
  }

  public async startListening() {
    await Promise.all([
      this.socketServerService.start(),
      this.discoveryService.startAdvertising()
    ]);

    if (this.discoveryService.advertising.getValue() === State.Stopped
      || this.socketServerService.state.getValue() === State.Stopped) {
      await this.discoveryService.stopAdvertising(),
        await this.socketServerService.stop();
    }
  }

  public async stopListening() {
    await this.socketServerService.stopListening();
  }

  async stopServiceListening() {
    await Promise.all([
      await this.discoveryService.stopAdvertising(),
      await this.socketServerService.stop()
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
        filter(state => state !== ConnectionState.Connecting),
        take(1)
      ).toPromise();

      if (result === ConnectionState.Connected) {
        this.connectedDevices.getValue().push(device);
      }
    }
  }

  // Mixed interface

  public disconnect(): void {
    // we assume that services perform noop if not connected
    this.socketClientService.disconnect();
    this.socketServerService.disconnect();
    this.connectedDevices.next(new Array<Device>());
  }

  public send(message: any): void {
    // in order to prevent a mess we always send messages to the server if it's connected
    if (this.socketServerService.connected.getValue()) {
      this.socketServerService.send(message);
    } else {
      this.socketClientService.send(message);
    }
  }

  public goToNetworkSettings() {
    // cordova.plugins.diagnostic.switchToSettings(); ios
    cordova.plugins.diagnostic.switchToWifiSettings(); // android win
  }

  timeout() {
    this.timer = setTimeout(() => this.ngZone.run(() => {
      this.checkWiFiState();
      this.timeout();
    }), 100);
  }

  async cancelDiscovery() {}

  async enableDiscovery() {}

  private async checkWiFiState() {
    await cordova.plugins.diagnostic.isWifiEnabled((available) => {
      if (available === 1) {
        if (navigator.connection.type === 'wifi') {
          this.state.next(State.Started);
          if (this.toggled.getValue() && this.stopped.getValue()) {
            this.startListening();
          }
        } else {
          this.state.next(State.Starting);
          if (this.toggled.getValue() && this.listening.getValue()) {
            this.devices.next(new Map<string, Device>());
            this.stopListening();
          }
        }
      } else {
        if (this.state.getValue() !== State.Stopped) {
          this.state.next(State.Stopped);
          this.devices.next(new Map<string, Device>());
          this.toggled.next(false);
          this.stopListening();
        }
      }
    }, (error) => {
      console.error('The following error occurred: ' + error);
      this.state.next(State.Stopped);
      this.devices.next(new Map<string, Device>());
      this.toggled.next(false);
      this.stopListening();
    });
  }

  private async init() {

    this.timeout();
  }
}
