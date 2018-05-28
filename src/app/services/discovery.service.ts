import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject, timer } from 'rxjs';

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
  public devices: BehaviorSubject<Map<string, any>> = new BehaviorSubject<Map<string, any>>(new Map<string, any>());

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

  async searchDevices(duration: number) {
    if (this.discovering.getValue() !== State.Stopped) {
      return;
    }

    this.devices.next(new Map<string, object>());
    this.discovering.next(State.Starting);

    cordova.plugins.zeroconf.watch('_spatium._tcp.', 'local.',
      result => this.ngZone.run(() => {
        const action = result.action;
        const service = result.service;
        if (action === 'resolved') {
          const devices = this.devices.getValue();

          devices.set(service.name, {
            name: service.name,
            ipv4: service.ipv4Addresses,
            ipv6: service.ipv6Addresses,
            ip: service.txtRecord.ip,
            port: service.port,
            version: service.txtRecord.version
          });

          this.devices.next(devices);
        }
      }));

    this.discovering.next(State.Started);

    await timer(duration).toPromise();

    this.discovering.next(State.Stopping);

    await new Promise((resolve, reject) => {
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
}
