import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConnectionState } from './primitives/state';
import { Device } from './primitives/device';

declare const cordova: any;

@Injectable()
export class SocketClientService {
  public state: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);
  public message: Subject<string> = new Subject<string>();

  public connectedDevice = new BehaviorSubject<Device>(null);

  private socket: BehaviorSubject<WebSocket> = new BehaviorSubject<WebSocket>(null);

  constructor(private ngZone: NgZone) {}

  async getDeviceName() {
    return await new Promise((resolve, reject) => cordova.plugins.deviceName.get(resolve, reject));
  }

  public async connect(device: Device) {
    if (this.state.getValue() !== ConnectionState.None) {
      return;
    }

    const name = await this.getDeviceName();

    const socket = new WebSocket('ws://' + device.ip + ':3445/?name=' + name);
    socket.onopen = () => this.ngZone.run(() => {
      this.state.next(ConnectionState.Connected);
      this.connectedDevice.next(device);
    });
    socket.onmessage = (event) => this.ngZone.run(() => this.message.next(event.data));
    socket.onclose = () => this.ngZone.run(() => {
      this.connectedDevice.next(null);
      this.state.next(ConnectionState.None);
    });
    socket.onerror = (event) => this.ngZone.run(() => {
      this.connectedDevice.next(null);
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
