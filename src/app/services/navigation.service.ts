import { Injectable, NgZone } from '@angular/core';
import { DeviceService } from './device.service';
import { Subject } from 'rxjs';

@Injectable()
export class NavigationService {
  public backEvent: Subject<any> = new Subject<any>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly device: DeviceService
  ) {
    this.init();
  }

  async init() {
    await this.device.deviceReady();

    document.addEventListener('backbutton', e => this.ngZone.run(() => {
      this.backEvent.next(e);
    }), false);
  }

}
