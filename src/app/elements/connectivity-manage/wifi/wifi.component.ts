import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import { DeviceService, Platform } from '../../../services/device.service';
import { WiFiService } from '../../../services/wifi.service';

declare const cordova: any;

@Component({
  selector: 'app-wifi-manage',
  templateUrl: './wifi.component.html',
  styleUrls: ['./wifi.component.css', '../connectivity-manage.css']
})
export class WiFiComponent implements OnInit, OnDestroy {
  public available: boolean;
  public enabled: boolean;
  public connected: boolean;

  constructor(
    private readonly ngZone: NgZone,
    private readonly deviceService: DeviceService,
    private readonly wifiService: WiFiService) {
    wifiService.available.subscribe(available => this.ngZone.run(() => this.available = available));
    wifiService.enabled.subscribe(enabled => this.ngZone.run(() => this.enabled = enabled));
    wifiService.connected.subscribe(connected => this.ngZone.run(() => this.connected = connected));
  }

  async ngOnInit() { }

  async ngOnDestroy() { }

  networkSettings() {
    if (this.deviceService.platform === Platform.IOS) {
      cordova.plugins.settings.open('wifi', function () {
          console.log('opened wifi settings');
        },
        function () {
          console.log('failed to open wifi settings');
        }
      );
    } else {
      cordova.plugins.diagnostic.switchToWifiSettings();
    }
  }
}
