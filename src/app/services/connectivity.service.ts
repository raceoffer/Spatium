import { Injectable } from '@angular/core';
import { SocketClientService, State as ConnectionState } from './socketclient.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { toBehaviourSubject } from '../utils/transformers';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { SocketServerService } from './socketserver.service';
import { Observable } from 'rxjs/Observable';

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

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(
    this.connectionState.map(state => state === ConnectionState.Connected),
    false);

  public message = combineLatest([
      this.socketClientService.message,
      this.socketServerService.message
    ], (clientMessage, serverMessage) => {
      // in order to prevent a mess we ignore messages to the server while the client is connected
      return this.socketClientService.connected.getValue() ? clientMessage : serverMessage;
    }
  );

  public connectedChanged: Observable<any> = this.connected.skip(1).distinctUntilChanged();
  public connectedEvent: Observable<any> = this.connectedChanged.filter(connected => connected).mapTo(null);
  public disconnectedEvent: Observable<any> = this.connectedChanged.filter(connected => !connected).mapTo(null);

  constructor(
    private readonly socketClientService: SocketClientService,
    private readonly socketServerService: SocketServerService
  ) { }

  // Server interface

  public async start() {
    await this.socketServerService.start();
  }

  public async stop() {
    await this.socketServerService.stop();
  }

  // Client interface

  public connect(ip: string) {
    this.socketClientService.connect(ip);
  }

  // Mixed interface

  public disconnect(): void {
    // we assume that services perform noop if not connected
    this.socketClientService.disconnect();
    this.socketServerService.disconnect();
  }

  public send(message: object): void {
    // in order to prevent a mess we slways send messages to the server if it's connected
    if (this.socketServerService.connected.getValue()) {
      this.socketServerService.send(message);
    } else {
      this.socketClientService.send(message);
    }
  }
}
