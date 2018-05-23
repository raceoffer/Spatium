import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { toBehaviourSubject } from '../utils/transformers';
import { Observable } from 'rxjs/Observable';

declare const cordova: any;

export enum State {
  Starting,
  Started,
  Stopping,
  Stopped
}

@Injectable()
export class SocketServerService {
  private currentPeer: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.currentPeer.map(peer => peer !== null), false);
  public message: ReplaySubject<object> = new ReplaySubject<object>(1);

  public connectedChanged: Observable<any> = this.connected.skip(1).distinctUntilChanged();
  public connectedEvent: Observable<any> = this.connectedChanged.filter(connected => connected).mapTo(null);
  public disconnectedEvent: Observable<any> = this.connectedChanged.filter(connected => !connected).mapTo(null);

  constructor(private ngZone: NgZone) { }

  public async start() {
    if (this.state.getValue() !== State.Stopped) {
      return;
    }

    this.state.next(State.Starting);

    return await new Promise((resolve, reject) =>
      cordova.plugins.wsserver.start(3445, {
        onFailure:  () => this.ngZone.run(() => {
          this.state.next(State.Stopped);
        }),
        onOpen: conn => this.ngZone.run(() => {
          if (this.connected.getValue()) {
            cordova.plugins.wsserver.close(conn);
          } else {
            this.currentPeer.next(conn.uuid);
          }
        }),
        onMessage: (conn, msg) => this.ngZone.run(() => {
          this.message.next(JSON.parse(msg));
        }),
        onClose: () => this.ngZone.run(() => {
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

    cordova.plugins.wsserver.close({ uuid: this.currentPeer.getValue() });
  }

  public send(message: object): void {
    if (!this.connected.getValue()) {
      return;
    }

    cordova.plugins.wsserver.send({ uuid: this.currentPeer.getValue() }, JSON.stringify(message));
  }
}
