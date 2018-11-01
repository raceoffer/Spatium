import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {DeviceService} from './device.service';

@Injectable()
export class NetworkService {
  public online: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private readonly deviceService: DeviceService) {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    document.addEventListener('online', () => {
      this.online.next(true);
    }, false);

    document.addEventListener('offline', () => {
      this.online.next(false);
    }, false);
  }
}
