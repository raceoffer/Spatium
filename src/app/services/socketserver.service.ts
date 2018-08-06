import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject, interval } from 'rxjs';
import { ConnectionState, State } from './primitives/state';
import { ProviderType } from './interfaces/connection-provider';
import { Device } from './primitives/device';
import { filter, takeUntil, debounceTime } from 'rxjs/operators';

declare const cordova: any;

@Injectable()
export class SocketServerService {
  public state = new BehaviorSubject<State>(State.Stopped);
  public connectionState = new BehaviorSubject<ConnectionState>(ConnectionState.None);

  public message = new Subject<string>();

  public connectedDevice = new BehaviorSubject<Device>(null);

  public port = 3445;

  private currentPeer = new BehaviorSubject<string>(null);

  private keepAlive = new Subject<any>();

  constructor(private ngZone: NgZone) {}

  public async getIpv4Address() {
    return new Promise<string>((resolve, reject) => {
      cordova.plugins.wsserver.getInterfaces(
        interfaces => {
          for (const interfaceName in interfaces) {
            if (interfaces.hasOwnProperty(interfaceName)) {
              const iface = interfaces[interfaceName];
              if (iface.hasOwnProperty('ipv4Addresses')) {
                const ipv4Addresses = iface.ipv4Addresses;
                if (ipv4Addresses.length > 0) {
                  resolve(ipv4Addresses[0]);
                }
              }
            }
          }
          reject(new Error('No valid interfaces found'));
        },
        reject
      );
    });
  }

  public async start() {
    if (this.state.getValue() !== State.Stopped) {
      return;
    }

    this.state.next(State.Starting);

    return await new Promise((resolve, reject) =>
      cordova.plugins.wsserver.start(this.port, {
        onFailure: (addr, port, reason) => this.ngZone.run(() => {
          console.log('Stopped listening on %s:%d. Reason: %s', addr, port, reason);
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
              conn.remoteAddr,
              this.port
            ));
            this.connectionState.next(ConnectionState.Connected);

            interval(3000).pipe(
              takeUntil(this.connectionState.pipe(
                filter(state => state !== ConnectionState.Connected)
              ))
            ).subscribe(() => {
              this.refreshConnection();
            });
            this.keepAlive.pipe(
              debounceTime(10000),
              takeUntil(this.connectionState.pipe(
                filter(state => state !== ConnectionState.Connected)
              ))
            ).subscribe(async () => {
              console.log('Server Keep-Alive failed');
              this.disconnect();
            });
          }
        }),
        onMessage: (conn, msg) => this.ngZone.run(() => {
          this.keepAlive.next();
          if (msg !== '__keep-alive__') {
            this.message.next(msg);
          }
        }),
        onClose: (conn) => this.ngZone.run(() => {
          if (this.currentPeer.getValue() === conn.uuid) {
            console.log('Server received disconnect');
            this.connectionState.next(ConnectionState.None);
            this.connectedDevice.next(null);
            this.currentPeer.next(null);
          }
        }),
        tcpNoDelay: true
      }, (addr, port) => this.ngZone.run(() => {
        this.port = port;
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

    this.disconnect();

    return new Promise((resolve, reject) =>
      cordova.plugins.wsserver.stop(() => this.ngZone.run(() => {
        this.state.next(State.Stopped);
        resolve();
      }), reason => this.ngZone.run(() => {
        this.state.next(State.Started);
        reject(reason);
      })));
  }

  public disconnect() {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      return;
    }

    console.log('Server called disconnect');

    cordova.plugins.wsserver.close({uuid: this.currentPeer.getValue()});

    console.log('Server performed disconnect itself');
    this.connectionState.next(ConnectionState.None);
    this.connectedDevice.next(null);
    this.currentPeer.next(null);
  }

  public refreshConnection() {
    this.send('__keep-alive__');
  }

  public send(message: string): void {
    if (this.connectionState.getValue() !== ConnectionState.Connected) {
      return;
    }

    cordova.plugins.wsserver.send({uuid: this.currentPeer.getValue()}, message);
  }
}
