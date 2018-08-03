import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject, interval } from 'rxjs';
import { ConnectionState } from './primitives/state';
import { Device } from './primitives/device';
import { filter, takeUntil, debounceTime } from 'rxjs/operators';

declare const cordova: any;

@Injectable()
export class SocketClientService {
  public state: BehaviorSubject<ConnectionState> = new BehaviorSubject<ConnectionState>(ConnectionState.None);
  public message: Subject<string> = new Subject<string>();

  public connectedDevice = new BehaviorSubject<Device>(null);

  private socket: BehaviorSubject<WebSocket> = new BehaviorSubject<WebSocket>(null);

  private keepAlive = new Subject<any>();

  constructor(private ngZone: NgZone) {}

  async getDeviceName() {
    return await new Promise((resolve, reject) => cordova.plugins.deviceName.get(resolve, reject));
  }

  public async connect(device: Device) {
    if (this.state.getValue() !== ConnectionState.None) {
      return;
    }

    const name = await this.getDeviceName();

    const socket = new WebSocket('ws://' + device.ip + ':' + device.port + '/?name=' + name);
    socket.onopen = () => this.ngZone.run(() => {
      this.state.next(ConnectionState.Connected);
      this.connectedDevice.next(device);

      interval(3000).pipe(
        takeUntil(this.state.pipe(
          filter(state => state !== ConnectionState.Connected)
        ))
      ).subscribe(() => {
        this.refreshConnection();
      });
      this.keepAlive.pipe(
        debounceTime(10000),
        takeUntil(this.state.pipe(
          filter(state => state !== ConnectionState.Connected)
        ))
      ).subscribe(() => {
        console.log('Client Keep-Alive failed');
        this.disconnect();
      });
    });
    socket.onmessage = (event) => this.ngZone.run(() => {
      this.keepAlive.next();
      if (event.data !== '__keep-alive__') {
        this.message.next(event.data);
      }
    });
    socket.onclose = () => this.ngZone.run(() => {
      console.log('Client received disconnect');
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

  public disconnect() {
    if (this.state.getValue() !== ConnectionState.Connected) {
      return;
    }

    console.log('Client called disconnect');

    this.socket.getValue().close();
  }

  public refreshConnection() {
    this.send('__keep-alive__');
  }

  public send(message: string): void {
    if (this.state.getValue() !== ConnectionState.Connected) {
      return;
    }

    this.socket.getValue().send(message);
  }
}
