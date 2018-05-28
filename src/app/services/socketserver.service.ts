import { Injectable, NgZone } from '@angular/core';
import { toBehaviourSubject } from '../utils/transformers';
import { BehaviorSubject, ReplaySubject, Observable } from 'rxjs';
import { skip, filter, distinctUntilChanged, map, mapTo } from "rxjs/operators";

declare const cordova: any;

import { State } from './discovery.service';
export { State } from './discovery.service';

@Injectable()
export class SocketServerService {
  private currentPeer: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.currentPeer.pipe(map(peer => peer !== null)), false);
  public message: ReplaySubject<any> = new ReplaySubject<any>(1);

  public connectedChanged: Observable<any> = this.connected.pipe(skip(1), distinctUntilChanged());
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  constructor(private ngZone: NgZone) {}

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

  public send(message: any): void {
    if (!this.connected.getValue()) {
      return;
    }

    cordova.plugins.wsserver.send({ uuid: this.currentPeer.getValue() }, JSON.stringify(message));
  }
}
