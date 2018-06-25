import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import { toBehaviourSubject, toReplaySubject } from '../utils/transformers';
import { DiscoveryService } from './discovery.service';
import { IConnectionProvider } from './interfaces/i-connectivity-provider';
import { ConnectionState, State } from './primitives/state';
import { SocketClientService } from './socketclient.service';
import { SocketServerService } from './socketserver.service';
import { NotificationService } from './notification.service';

declare const cordova;
declare const navigator;

@Injectable()
export class ConnectivityService implements IConnectionProvider {
  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

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
  public connected: BehaviorSubject<boolean> = toBehaviourSubject(
    this.connectionState.pipe(map(state => state === ConnectionState.Connected)),
    false);
  public connectedChanged: Observable<any> = this.connected.pipe(distinctUntilChanged(), skip(1));
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));
  public connectionStateChanged: Observable<ConnectionState> = this.connectionState.pipe(distinctUntilChanged(), skip(1));
  public serverState: BehaviorSubject<State> = toBehaviourSubject(
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
  public starting: BehaviorSubject<boolean> = toBehaviourSubject(this.serverState.pipe(map(state => state === State.Starting)), false);
  public stopping: BehaviorSubject<boolean> = toBehaviourSubject(this.serverState.pipe(map(state => state === State.Stopping)), false);
  public listening: BehaviorSubject<boolean> = toBehaviourSubject(this.serverState.pipe(map(state => state === State.Started)), false);
  public listeningChanged: Observable<any> = this.listening.pipe(distinctUntilChanged(), skip(1));
  public listeningStartedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => listening), mapTo(null));
  public listeningStoppedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => !listening), mapTo(null));
  public discoveryState: BehaviorSubject<State> = this.discoveryService.discovering;
  public discovering: BehaviorSubject<boolean> = toBehaviourSubject(
    this.discoveryState.pipe(map(state => state === State.Started)),
    false);
  public discoveringChanged: Observable<any> = this.discovering.pipe(distinctUntilChanged(), skip(1));
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => discovering), mapTo(null));
  public discoveryStoppedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => !discovering), mapTo(null));
  public message = toReplaySubject(merge(
    this.socketClientService.message,
    // in order to prevent a mess we ignore messages to the server while the client is connected
    this.socketServerService.message.pipe(filter(_ => !this.socketClientService.connected.getValue()))
  ), 1);
  public devices = this.discoveryService.devices;
  public isToggler: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  discoverableState: BehaviorSubject<State>;
  discoverable: BehaviorSubject<boolean>;
  discoverableChanged: Observable<boolean>;
  discoverableStartedEvent: Observable<any>;
  discoverableFinishedEvent: Observable<any>;

  constructor(private readonly notification: NotificationService,
              private readonly socketClientService: SocketClientService,
              private readonly socketServerService: SocketServerService,
              private readonly discoveryService: DiscoveryService) {

    document.addEventListener('offline', () => {
      this.stopListening();
    }, false);

  }

  // Server interface

  public async toggleProvider() {
    if (!this.listening.getValue()) {
      this.isToggler.next(true);
      await cordova.plugins.diagnostic.isWifiAvailable(async (available) => {
        console.log('WiFi is ' + (available ? 'available' : 'not available'));
        if (available) {
          const networkState = navigator.connection.type;
          console.log(networkState);
          if (networkState === 'wifi') {
            await this.startListening();
          } else {
            this.notification.showWifiSettings('No WiFi conection');
          }
        } else {
          await this.openRequestWiFiDialog();
        }
      }, (error) => {
        console.error('The following error occurred: ' + error);
      });
    } else {
      await this.stopListening();
    }
  }

  async openRequestWiFiDialog() {
    navigator.notification.confirm(
      'An app wants to turn on WiFi',
      buttonIndex => {
        if (buttonIndex === 1) { // yes
          cordova.plugins.diagnostic.setWifiState(() => {
              console.log('Wifi was enabled');
              document.addEventListener('online', () => {
                const networkState = navigator.connection.type
                console.log(networkState);
                if (networkState === 'wifi') {
                  this.startListening();
                } else {

                }
              }, false);
            }, (error) => {
              console.error('The following error occurred: ' + error);
            },
            true);
        } else {
          this.isToggler.next(false);
        }
      },
      '',
      ['ALLOW', 'DENY']
    );
  }

  public async startListening() {
    await Promise.all([
      this.socketServerService.start(),
      this.discoveryService.startAdvertising()
    ]);

    if (this.discoveryService.advertising.getValue() === State.Stopped) {
      await this.socketServerService.stop();
    }
    this.isToggler.next(false);
  }

  public async stopListening() {
    await Promise.all([
      await this.discoveryService.stopAdvertising(),
      await this.socketServerService.stop()
    ]);
    this.isToggler.next(false);
  }

  // Client interface

  public async searchDevices(duration: number) {
    await this.discoveryService.searchDevices(duration);
  }

  public connect(ip: string): void {
    this.socketClientService.connect(ip);
  }

  // Mixed interface

  public disconnect(): void {
    // we assume that services perform noop if not connected
    this.socketClientService.disconnect();
    this.socketServerService.disconnect();
  }

  public send(message: any): void {
    // in order to prevent a mess we always send messages to the server if it's connected
    if (this.socketServerService.connected.getValue()) {
      this.socketServerService.send(message);
    } else {
      this.socketClientService.send(message);
    }
  }

  async enableDiscovery() {}
}
