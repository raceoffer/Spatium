import { Injectable } from '@angular/core';
import { DeviceService, Platform } from './device.service';

@Injectable()
export class HockeyService {

  constructor(private readonly deviceService: DeviceService) { }

  get appId(): string {
    switch (this.deviceService.platform) {
      case Platform.Android:
        return '6b6ba70293374813adb0f550308a7cf8';
      case Platform.Windows:
        return 'e5c2e9e03a00418fb37a77c2fc291c51';
      case Platform.IOS:
        return '34994df5452c4d5797f4009a8a6430d2';
      default:
        return '';
    }
  }
}
