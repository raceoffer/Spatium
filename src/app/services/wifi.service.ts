import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {DeviceService} from './device.service';

declare const cordova: any;

@Injectable()
export class WiFiService {
  public available: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public enabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public connected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private readonly deviceService: DeviceService) {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    cordova.plugins.ssdp.isAvailable().then(available => this.updateAvailabilityStatus(available));
    cordova.plugins.ssdp.isEnabled().then(enabled => this.updateAdapterStatus(enabled));
    cordova.plugins.ssdp.isConnected().then(connected => this.updateConnectionStatus(connected));

    cordova.plugins.ssdp.setAvailabilityChangedCallback(available => this.updateAvailabilityStatus(available));
    cordova.plugins.ssdp.setAdapterStatusChangedCallback(enabled => this.updateAdapterStatus(enabled));
    cordova.plugins.ssdp.setConnectionChangedCallback(connected => this.updateConnectionStatus(connected));
  }

  private updateAvailabilityStatus(available: boolean) {
    if (available !== this.available.getValue()) {
      this.available.next(available);
    }
  }

  private updateAdapterStatus(enabled: boolean) {
    if (enabled !== this.enabled.getValue()) {
      this.enabled.next(enabled);
    }
  }

  private updateConnectionStatus(connected: boolean) {
    if (connected !== this.connected.getValue()) {
      this.connected.next(connected);
    }
  }
}
