import { Injectable } from '@angular/core';
import { SocketClientService, State as ConnectionState } from './socketclient.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { toBehaviourSubject, toReplaySubject } from '../utils/transformers';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { merge } from 'rxjs/observable/merge';
import { SocketServerService, State as ServerState } from './socketserver.service';
import { Observable } from 'rxjs/Observable';
import { DiscoveryService } from './discovery.service';

export { ServerState };
export { ConnectionState };

@Injectable()
export class ConnectivityService {
  public connectionState: BehaviorSubject<ConnectionState> = toBehaviourSubject(
    combineLatest([
      this.socketClientService.state,
      this.socketServerService.connected
    ], (clientState, serverConnected) => {
      return serverConnected ? ConnectionState.Connected : clientState;
    }),
    ConnectionState.None
  );

  public serverState: BehaviorSubject<ServerState> = toBehaviourSubject(
    combineLatest([
      this.discoveryService.advertising,
      this.socketServerService.state
    ], (discoveryState, serverState) => {
      if (discoveryState === serverState) {
        return serverState;
      } else if ([discoveryState, serverState].some(v => v === ServerState.Starting)) {
        return ServerState.Starting;
      } else if ([discoveryState, serverState].some(v => v === ServerState.Stopping)) {
        return ServerState.Stopping;
      } else {
        return ServerState.Starting;
      }
    }),
    ServerState.Stopped
  );

  public discoveryState: BehaviorSubject<ServerState> = this.discoveryService.discovering;

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(
    this.connectionState.map(state => state === ConnectionState.Connected),
    false);

  public listening: BehaviorSubject<boolean> = toBehaviourSubject(
    this.serverState.map(state => state === ServerState.Started),
    false);

  public discovering: BehaviorSubject<boolean> = toBehaviourSubject(
    this.discoveryState.map(state => state === ServerState.Started),
    false);

  public message = toReplaySubject(merge(
    this.socketClientService.message,
    // in order to prevent a mess we ignore messages to the server while the client is connected
    this.socketServerService.message.filter(_ => !this.socketClientService.connected.getValue())
  ), 1);

  public devices = this.discoveryService.devices;

  public connectedChanged: Observable<any> = this.connected.skip(1).distinctUntilChanged();
  public connectedEvent: Observable<any> = this.connectedChanged.filter(connected => connected).mapTo(null);
  public disconnectedEvent: Observable<any> = this.connectedChanged.filter(connected => !connected).mapTo(null);

  public listeningChanged: Observable<any> = this.listening.skip(1).distinctUntilChanged();
  public listeningStartedEvent: Observable<any> = this.listeningChanged.filter(listening => listening).mapTo(null);
  public listeningStoppedEvent: Observable<any> = this.listeningChanged.filter(listening => !listening).mapTo(null);

  public discoveringChanged: Observable<any> = this.discovering.skip(1).distinctUntilChanged();
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.filter(discovering => discovering).mapTo(null);
  public discoveryStoppedEvent: Observable<any> = this.discoveringChanged.filter(discovering => !discovering).mapTo(null);

  constructor(
    private readonly socketClientService: SocketClientService,
    private readonly socketServerService: SocketServerService,
    private readonly discoveryService: DiscoveryService
  ) { }

  // Server interface

  public async startListening() {
    await Promise.all([
      this.socketServerService.start(),
      this.discoveryService.startAdvertising()
    ]);
  }

  public async stopListening() {
    await Promise.all([
      await this.discoveryService.stopAdvertising(),
      await this.socketServerService.stop()
    ]);
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
}
