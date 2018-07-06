import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import { toBehaviourSubject } from '../utils/transformers';
import { ConnectionState } from './primitives/state';

@Injectable()
export class SocketClientService {
  public state: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);
  public connected: BehaviorSubject<boolean> = toBehaviourSubject(this.state.pipe(map(state => state === ConnectionState.Connected)), false);
  public connectedChanged: Observable<any> = this.connected.pipe(skip(1), distinctUntilChanged());
  public connectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => connected), mapTo(null));
  public disconnectedEvent: Observable<any> = this.connectedChanged.pipe(filter(connected => !connected), mapTo(null));
  public message: Subject<any> = new Subject<any>();
  private socket: BehaviorSubject<WebSocket> = new BehaviorSubject<WebSocket>(null);

  constructor(private ngZone: NgZone) {}

  public connect(ip: string) {
    if (this.state.getValue() !== ConnectionState.None) {
      return;
    }

    const socket = new WebSocket('ws://' + ip + ':3445');
    socket.onopen = () => this.ngZone.run(() => this.state.next(ConnectionState.Connected));
    socket.onmessage = (event) => this.ngZone.run(() => this.message.next(JSON.parse(event.data)));
    socket.onclose = () => this.ngZone.run(() => this.state.next(ConnectionState.None));
    socket.onerror = (event) => this.ngZone.run(() => {
      this.state.next(ConnectionState.None);
      console.log(event);
    });
    this.socket.next(socket);
    this.state.next(ConnectionState.Connecting);
  }

  public disconnect(): void {
    if (this.state.getValue() !== ConnectionState.Connected) {
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
