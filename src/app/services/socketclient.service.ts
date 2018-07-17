import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConnectionState } from './primitives/state';

@Injectable()
export class SocketClientService {
  public state: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);
  public message: Subject<string> = new Subject<string>();

  private socket: BehaviorSubject<WebSocket> = new BehaviorSubject<WebSocket>(null);

  constructor(private ngZone: NgZone) {}

  public connect(ip: string) {
    if (this.state.getValue() !== ConnectionState.None) {
      return;
    }

    const socket = new WebSocket('ws://' + ip + ':3445');
    socket.onopen = () => this.ngZone.run(() => this.state.next(ConnectionState.Connected));
    socket.onmessage = (event) => this.ngZone.run(() => this.message.next(event.data));
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

  public send(message: string): void {
    if (this.state.getValue() !== ConnectionState.Connected) {
      return;
    }

    this.socket.getValue().send(message);
  }
}
