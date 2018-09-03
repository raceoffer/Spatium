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

  public deviceReady() {
    return this.ready.pipe(
      filter(ready => ready),
      first(),
    ).toPromise();
  }

  async getAppInfo() {
    const result = [];

    try {
      result.push('Identifier: ' + navigator.appInfo.identifier + '\n');
      result.push('Version: ' + navigator.appInfo.version + '\n');
      result.push('Build: ' + navigator.appInfo.build + '\n\n');

      console.debug(result);
    } catch (err) {
      console.error(err);
    }

    return result;
  }

  async getDeviceInfo() {
    const result = [];

    result.push('Device: ' + device.manufacturer.toString() + ' ' + device.model.toString() + '\n');
    result.push('Platform: ' + device.platform.toString() + ' ' + device.version.toString() + '\n');
    result.push('Cordova: ' + device.cordova.toString() + '\n\n');

    return result;
  }

}
