import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { first, filter } from 'rxjs/operators';

@Injectable()
export class DeviceService {
  public ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() {
      document.addEventListener('deviceready', () => {
        this.ready.next(true);
      }, false);
  }

  public deviceReady() {
    return this.ready.pipe(
      filter(ready => ready),
      first(),
    ).toPromise();
  }
}
