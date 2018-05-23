import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const cordova: any;
declare const window: any;

export enum State {
  Starting,
  Started,
  Stopping,
  Stopped
}

@Injectable()
export class DiscoveryService {
  public advertising: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discovering: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public devices: BehaviorSubject<Map<string, object>> = new BehaviorSubject<Map<string, object>>(new Map<string, object>());

  constructor(private ngZone: NgZone) {}

  async getHostName() {
    return await new Promise((resolve, reject) => {
      cordova.plugins.zeroconf.getHostname(
        host => {
          resolve(host);
        }, error => {
          reject(error);
        });
    });
  }

  async startAdvertising() {
    if (this.advertising.getValue() !== State.Stopped) {
      return;
    }

    this.advertising.next(State.Starting);

    const hostname = await this.getHostName();
    const ip: any = await new Promise((resolve, reject) => window.networkinterface.getWiFiIPAddress(resolve, reject));
    return await new Promise((resolve, reject) => {
      cordova.plugins.zeroconf.register('_spatium._tcp.', 'local.', hostname, 3445, {
        version: '0.0001',
        ip: ip.ip
      }, () => this.ngZone.run(() => {
        this.advertising.next(State.Started);
        resolve();
      }), error => this.ngZone.run(() => {
        this.advertising.next(State.Stopped);
        console.log(error);
        reject(error);
      }));
    });
  }

  async stopAdvertising() {
    if (this.advertising.getValue() !== State.Started) {
      return;
    }

    this.advertising.next(State.Stopping);

    return await new Promise((resolve, reject) => {
      cordova.plugins.zeroconf.stop(
        () => this.ngZone.run(() => {
          this.advertising.next(State.Stopped);
          resolve();
        }), error => this.ngZone.run(() => {
          this.advertising.next(State.Started);
          console.log(error);
          reject(error);
        }));
    });
  }

  async startDiscovery() {
    if (this.discovering.getValue() !== State.Stopped) {
      return;
    }

    this.devices.next(new Map<string, object>());
    this.discovering.next(State.Started);

    return await new Promise((resolve, reject) => {
      cordova.plugins.zeroconf.watch('_spatium._tcp.', 'local.',
        result => this.ngZone.run(() => {
          const action = result.action;
          const service = result.service;
          if (action === 'added') {
          } else if (action === 'resolved') {
            this.setDevice(service.name, {
              name: service.name,
              ipv4: service.ipv4Addresses,
              ipv6: service.ipv6Addresses,
              ip: service.txtRecord.ip,
              port: service.port,
              version: service.txtRecord.version
            });
          } else {
            this.removeDevice(service.name);
          }
          resolve();
        }), error => this.ngZone.run(() => {
          this.discovering.next(State.Stopped);
          console.log(error);
          reject(error);
        }));
    });
  }

  async stopDiscovery() {
    if (this.discovering.getValue() !== State.Started) {
      return;
    }

    this.discovering.next(State.Stopping);

    return await new Promise((resolve, reject) => {
      cordova.plugins.zeroconf.close(
        () => this.ngZone.run(() => {
          this.discovering.next(State.Stopped);
          resolve();
        }), error => this.ngZone.run(() => {
          this.discovering.next(State.Started);
          console.log(error);
          reject(error);
        }));
    });
  }

  private setDevice(key: string, value: object): void {
    const devices = this.devices.getValue();

    devices.set(key, value);

    this.devices.next(devices);
  }

  private removeDevice(key): void {
    const devices = this.devices.getValue();

    devices.delete(key);

    this.devices.next(devices);
  }
}
