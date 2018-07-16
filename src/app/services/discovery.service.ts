import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject, Observable, timer } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/internal/operators';
import { ProviderType } from './interfaces/connection-provider';
import { Device, equals } from './primitives/device';
import { State } from './primitives/state';

declare const cordova: any;
declare const window: any;

@Injectable()
export class DiscoveryService {
  public advertising: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discovering: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());
  public devicesChanged: Observable<Map<string, Device>> = this.devices.pipe(
    distinctUntilChanged(equals),
    skip(1));

  constructor(private ngZone: NgZone) {}

  async getHostName() {
    return await new Promise((resolve, reject) => cordova.plugins.zeroconf.getHostname(resolve, reject));
  }

  async getDeviceName() {
    return await new Promise((resolve, reject) => cordova.plugins.deviceName.get(resolve, reject));
  }

  async getDeviceIp() {
    return (await new Promise((resolve, reject) => window.networkinterface.getWiFiIPAddress(resolve, reject)) as any).ip;
  }

  async startAdvertising() {
    if (this.advertising.getValue() !== State.Stopped) {
      return;
    }

    this.advertising.next(State.Starting);

    let hasErrors = false;

    const [hostname, name, ip] = await Promise.all([
      this.getHostName().catch((e) => {
        console.log(e);
        hasErrors = true;
      }),
      this.getDeviceName().catch((e) => {
        console.log(e);
        hasErrors = true;
      }),
      this.getDeviceIp().catch((e) => {
        console.log(e);
        hasErrors = true;
      })
    ]);

    if (!hasErrors) {
      return await new Promise((resolve, reject) => {
        cordova.plugins.zeroconf.register('_spatium._tcp.', 'local.', hostname, 3445, {
          name: name,
          ip: ip
        }, () => this.ngZone.run(() => {
          this.advertising.next(State.Started);
          resolve();
        }), error => this.ngZone.run(() => {
          this.advertising.next(State.Stopped);
          console.log(error);
          reject(error);
        }));
      });
    } else {
      this.advertising.next(State.Stopped);
      return;
    }

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

    this.devices.next(new Map<string, Device>());
    this.discovering.next(State.Starting);

    cordova.plugins.zeroconf.watch('_spatium._tcp.', 'local.',
      result => this.ngZone.run(() => {
        const action = result.action;
        const service = result.service;
        if (action === 'resolved') {
          const devices = this.devices.getValue();

          devices.set(service.txtRecord.name, new Device(
            ProviderType.ZEROCONF,
            service.txtRecord.name,
            null,
            service.txtRecord.ip
          ));

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
