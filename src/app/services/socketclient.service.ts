import { Injectable, NgZone } from '@angular/core';
import { toBehaviourSubject } from '../utils/transformers';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { skip, filter, distinctUntilChanged, map, mapTo } from "rxjs/operators";

export enum State {
  None,
  Connecting,
  Connected
}

@Injectable()
export class SocketClientService {
  private socket: BehaviorSubject<WebSocket> = new BehaviorSubject<WebSocket>(null);

  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.None);

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === State.Connected)), false);
  public message: ReplaySubject<any> = new ReplaySubject<any>(1);

  public connectedChanged: Observable<any> = this.connected.pipe(skip(1), distinctUntilChanged());
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));

  constructor(private ngZone: NgZone) {}

  public connect(ip: string) {
    if (this.state.getValue() !== State.None) {
      return;
    }

    const socket = new WebSocket('ws://' + ip + ':3445');
    socket.onopen = () => this.ngZone.run(() => this.state.next(State.Connected));
    socket.onmessage = (event) => this.ngZone.run(() => this.message.next(JSON.parse(event.data)));
    socket.onclose = () => this.ngZone.run(() => this.state.next(State.None));
    socket.onerror = (event) => this.ngZone.run(() => {
      this.state.next(State.None);
      console.log(event);
    });
    this.socket.next(socket);
    this.state.next(State.Connecting);
  }

  public disconnect(): void {
    if (!this.connected.getValue()) {
      return;
    }

    this.socket.getValue().close();
  }

  public send(message: any): void {
    if (!this.connected.getValue()) {
      return;
    }

    this.socket.getValue().send(JSON.stringify(message));
  }
}
