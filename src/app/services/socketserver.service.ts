import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConnectionState, State } from './primitives/state';
import { ProviderType } from './interfaces/connection-provider';
import { Device } from './primitives/device';

declare const cordova: any;

@Injectable()
export class SocketServerService {
  public state = new BehaviorSubject<State>(State.Stopped);
  public connectionState = new BehaviorSubject<ConnectionState>(ConnectionState.None);

  public message = new Subject<string>();

  public connectedDevice = new BehaviorSubject<Device>(null);

  private currentPeer = new BehaviorSubject<string>(null);

  constructor(private ngZone: NgZone) {}

  public async start() {
    if (this.state.getValue() !== State.Stopped) {
      return;
    }

    this.state.next(State.Starting);

    return await new Promise((resolve, reject) =>
      cordova.plugins.wsserver.start(3445, {
        onFailure: () => this.ngZone.run(() => {
          this.state.next(State.Stopped);
        }),
        onOpen: conn => this.ngZone.run(() => {
          if (this.connectionState.getValue() !== ConnectionState.None) {
            cordova.plugins.wsserver.close(conn);
          } else {
            this.currentPeer.next(conn.uuid);

            const match = conn.resource.match(/^\/?\??name=([^\s&]*)/);

            this.connectedDevice.next(new Device(
              ProviderType.ZEROCONF,
              (match && (match.length > 1)) ? decodeURI(match[1]) : 'Unknown',
              null,
              conn.remoteAddr
            ));
            this.connectionState.next(ConnectionState.Connected);
          }
        }),
        onMessage: (conn, msg) => this.ngZone.run(() => {
          this.message.next(msg);
        }),
        onClose: (conn) => this.ngZone.run(() => {
          if (this.currentPeer.getValue() === conn.uuid) {
            this.connectionState.next(ConnectionState.None);
            this.connectedDevice.next(null);
            this.currentPeer.next(null);
          }
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
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      return;
    }

    cordova.plugins.wsserver.close({uuid: this.currentPeer.getValue()});
  }

  public send(message: string): void {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      return;
    }

    cordova.plugins.wsserver.send({uuid: this.currentPeer.getValue()}, message);
  }
}
