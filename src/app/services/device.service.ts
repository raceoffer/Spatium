import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { first, filter } from 'rxjs/operators';

declare const device: any;

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

  public isIOS = this.platform === Platform.IOS;

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
}
