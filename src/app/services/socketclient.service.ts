import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { toBehaviourSubject } from '../utils/transformers';

export enum State {
  None,
  Connecting,
  Connected
}

@Injectable()
export class SocketClientService {
  private socket: BehaviorSubject<WebSocket> = new BehaviorSubject<WebSocket>(null);

  public state: BehaviorSubject<State> = new BehaviorSubject<State>(State.None);

  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.state.map(state => state === State.Connected), false);
  public message: ReplaySubject<object> = new ReplaySubject<object>(1);

  public connectedChanged: Observable<any> = this.connected.skip(1).distinctUntilChanged();
  public connectedEvent: Observable<any> = this.connectedChanged.filter(connected => connected).mapTo(null);
  public disconnectedEvent: Observable<any> = this.connectedChanged.filter(connected => !connected).mapTo(null);

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

  public send(message: object): void {
    if (!this.connected.getValue()) {
      return;
    }

    this.socket.getValue().send(JSON.stringify(message));
  }
}
