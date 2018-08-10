import { Injectable } from '@angular/core';
import { DeviceService, Platform } from './device.service';

declare const NativeStorage: any;

@Injectable()
export class StorageService {
  constructor(private readonly deviceService: DeviceService) {}

  async getValue(name: string) {
    if (this.deviceService.platform !== Platform.IOS) {
      return JSON.parse(localStorage.getItem(name));
    } else {
      try {
        return JSON.parse(await new Promise<any>((resolve, reject) => {
          NativeStorage.getItem(name, resolve, reject);
        }));
      } catch (ignored) {
        return null;
      }
    }
  }

  async setValue(name: string, value: any) {
    if (this.deviceService.platform !== Platform.IOS) {
      localStorage.setItem(name, JSON.stringify(value));
    } else {
      await new Promise((resolve, reject) => {
        NativeStorage.setItem(name, JSON.stringify(value), resolve, reject);
      });
    }
  }

  async removeValue(name: string) {
    if (this.deviceService.platform !== Platform.IOS) {
      localStorage.removeItem(name);
    } else {
      await new Promise((resolve, reject) => {
        NativeStorage.remove(name, resolve, reject);
      });
    }
  }
}
