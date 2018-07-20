import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject, timer } from 'rxjs';
import { ProviderType } from './interfaces/connection-provider';
import { Device } from './primitives/device';
import { State } from './primitives/state';

declare const cordova: any;
declare const window: any;

@Injectable()
export class DiscoveryService {
  public advertising: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);
  public discovering: BehaviorSubject<State> = new BehaviorSubject<State>(State.Stopped);

  public devices: BehaviorSubject<Map<string, Device>> = new BehaviorSubject<Map<string, Device>>(new Map<string, Device>());

  constructor(private ngZone: NgZone) {}

  async getHostName() {
    return await new Promise((resolve, reject) => cordova.plugins.zeroconf.getHostname(resolve, reject));
  }

  async getDeviceName() {
    return await new Promise((resolve, reject) => cordova.plugins.deviceName.get(resolve, reject));
  }

  async reset() {
    return await new Promise((resolve, reject) => cordova.plugins.zeroconf.reInit(resolve, reject));
  }

  async startAdvertising(address, port) {
    if (this.advertising.getValue() !== State.Stopped) {
      return;
    }

    this.advertising.next(State.Starting);

    try {
      await this.reset();

      const hostname = await this.getHostName();
      const deviceName = await this.getDeviceName();

      return await new Promise((resolve, reject) => {
        cordova.plugins.zeroconf.register('_spatium._tcp.', 'local.', hostname, port, {
          name: deviceName,
          ip: address
        }, () => this.ngZone.run(() => {
          this.advertising.next(State.Started);
          resolve();
        }), error => this.ngZone.run(() => {
          this.advertising.next(State.Stopped);
          console.log(error);
          reject(error);
        }));
      });
    } catch (e) {
      this.advertising.next(State.Stopped);
      throw e;
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

  async resetDevices() {
    this.devices.next(new Map<string, Device>());
  }

  async searchDevices(duration: number) {
    if (this.discovering.getValue() !== State.Stopped) {
      return;
    }

    this.discovering.next(State.Starting);
    this.devices.next(new Map<string, Device>());

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
            service.txtRecord.ip,
            service.port
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
