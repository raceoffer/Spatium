import { Injectable } from '@angular/core';
import { SocketClientService } from './socketclient.service';
import { toBehaviourSubject, toReplaySubject } from '../utils/transformers';
import { SocketServerService } from './socketserver.service';
import { DiscoveryService } from './discovery.service';
import { BehaviorSubject, Observable, combineLatest, merge } from 'rxjs';
import { skip, filter, distinctUntilChanged, map, mapTo } from "rxjs/operators";
import { ConnectionState, State } from "./primitives/state";

@Injectable()
export class ConnectivityService {
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

  public discoveryState: BehaviorSubject<State> = this.discoveryService.discovering;

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(
    this.connectionState.pipe(map(state => state === ConnectionState.Connected)),
    false);

  public listening: BehaviorSubject<boolean> = toBehaviourSubject(
    this.serverState.pipe(map(state => state === State.Started)),
    false);

  public discovering: BehaviorSubject<boolean> = toBehaviourSubject(
    this.discoveryState.pipe(map(state => state === State.Started)),
    false);

  public message = toReplaySubject(merge(
    this.socketClientService.message,
    // in order to prevent a mess we ignore messages to the server while the client is connected
    this.socketServerService.message.pipe(filter(_ => !this.socketClientService.connected.getValue()))
  ), 1);

  public devices = this.discoveryService.devices;

  public connectedChanged: Observable<any> = this.connected.pipe(distinctUntilChanged(), skip(1));
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  public listeningChanged: Observable<any> = this.listening.pipe(distinctUntilChanged(), skip(1));
  public listeningStartedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => listening), mapTo(null));
  public listeningStoppedEvent: Observable<any> = this.listeningChanged.pipe(filter(listening => !listening), mapTo(null));

  public discoveringChanged: Observable<any> = this.discovering.pipe(distinctUntilChanged(), skip(1));
  public discoveryStartedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => discovering), mapTo(null));
  public discoveryStoppedEvent: Observable<any> = this.discoveringChanged.pipe(filter(discovering => !discovering), mapTo(null));

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
