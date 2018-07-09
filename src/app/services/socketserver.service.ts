import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import { toBehaviourSubject } from '../utils/transformers';
import { ConnectionState, State } from './primitives/state';

declare const cordova: any;

@Injectable()
export class SocketServerService {
  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public message: Subject<any> = new Subject<any>();

  public connectionState: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.connectionState.pipe(map(state => state === ConnectionState.Connected)), false);
  public connectedChanged: Observable<any> = this.connected.pipe(skip(1), distinctUntilChanged());
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));
  private stoppedListening: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentPeer: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(private ngZone: NgZone) {}

  public async start() {
    if (this.state.getValue() !== State.Stopped) {
      this.stoppedListening.next(false);
      return;
    }

    this.state.next(State.Starting);

    return await new Promise((resolve, reject) =>
      cordova.plugins.wsserver.start(3445, {
        onFailure: () => this.ngZone.run(() => {
          this.state.next(State.Stopped);
        }),
        onOpen: conn => this.ngZone.run(() => {
          if (this.connectionState.getValue() !== ConnectionState.None && !this.stoppedListening.getValue()) {
            cordova.plugins.wsserver.close(conn);
          } else {
            this.currentPeer.next(conn.uuid);
            this.connectionState.next(ConnectionState.Connected);
          }
        }),
        onMessage: (conn, msg) => this.ngZone.run(() => {
          this.message.next(JSON.parse(msg));
        }),
        onClose: () => this.ngZone.run(() => {
          this.connectionState.next(ConnectionState.None);
          this.currentPeer.next(null);
        }),
        tcpNoDelay: true
      }, () => this.ngZone.run(() => {
        this.state.next(State.Started);
        resolve();
      }), reason => this.ngZone.run(() => {
        this.state.next(State.Stopped);
        reject(reason);
      })));
  }

  public async stopListening() {
    this.stoppedListening.next(true);
  }

  public async stop() {
    if (this.state.getValue() !== State.Started) {
      return;
    }

    this.state.next(State.Stopping);

    return new Promise((resolve, reject) =>
      cordova.plugins.wsserver.stop(() => this.ngZone.run(() => {
        this.state.next(State.Stopped);
        resolve();
      }), reason => this.ngZone.run(() => {
        this.state.next(State.Started);
        reject(reason);
      })));
  }

  public disconnect(): void {
    if (!this.connected.getValue()) {
      return;
    }

    cordova.plugins.wsserver.close({uuid: this.currentPeer.getValue()});
  }

  public send(message: any): void {
    if (!this.connected.getValue()) {
      return;
    }

    cordova.plugins.wsserver.send({uuid: this.currentPeer.getValue()}, JSON.stringify(message));
  }
}
