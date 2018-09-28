import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { first, filter } from 'rxjs/operators';

declare const cordova: any;
declare const device: any;
declare const navigator: any;

export enum Platform {
  Windows,
  IOS,
  Android
}

@Injectable()
export class DeviceService {
  public ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public resume: Subject<any> = new Subject<any>();

  public platform: Platform = null;

  constructor() {
      document.addEventListener('deviceready', () => {
        switch (device.platform.toLowerCase()) {
          case 'windows':
            this.platform = Platform.Windows;
            break;
          case 'android':
            this.platform = Platform.Android;
            break;
          case 'ios':
            this.platform = Platform.IOS;
            break;
        }
        this.ready.next(true);
      }, false);

      document.addEventListener('resume', () => {
        this.resume.next();
      }, false);
  }

  public async appInfo() {
    return await new Promise((resolve, reject) => navigator.appInfo.getAppInfo(resolve, reject));
  }

  public async deviceInfo() {
    let deviceName = null;
    try {
      deviceName = await new Promise<string>((resolve, reject) => {
        cordova.plugins.deviceName.get(resolve, reject);
      });
    } catch (e) {
      console.log(e);
    }

    return {
      uuid: device.uuid,
      manufacturer: device.manufacturer,
      model: device.model,
      name: !!deviceName ? deviceName : device.manufacturer + ' ' + device.model,
      platform: device.platform,
      version: device.version,
      cordova: device.cordova
    };
  }

  public deviceReady() {
    return this.ready.pipe(
      filter(ready => !!ready),
      first(),
    ).toPromise();
  }
}
