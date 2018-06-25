import { Injectable } from '@angular/core';
import { DeviceService, Platform } from './device.service';

@Injectable()
export class HockeyService {

  constructor(private readonly deviceService: DeviceService) { }

  get appId(): string {
    switch (this.deviceService.platform) {
      case Platform.Android:
        return '6a66e9dc6499491187e1bb8c3bfeced9';
      case Platform.Windows:
        return 'e5c2e9e03a00418fb37a77c2fc291c51';
      // TODO: return appId for iOS
      default:
        return '';
    }
  }
}
