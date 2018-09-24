import { Component, OnDestroy, OnInit } from '@angular/core';
import { DeviceService, Platform } from '../../../services/device.service';

declare const cordova: any;

@Component({
  selector: 'app-wifi-manage',
  templateUrl: './wifi.component.html',
  styleUrls: ['./wifi.component.css', '../connectivity-manage.css']
})
export class WiFiComponent implements OnInit, OnDestroy {

  constructor(private readonly deviceService: DeviceService) { }

  async ngOnInit() { }

  async ngOnDestroy() { }

  async enableWifi() {
    if (this.deviceService.platform === Platform.IOS) {
      this.networkSettings();
    } else {
      cordova.plugins.diagnostic.setWifiState(function () {
        console.log('Wifi was enabled');
      }, function (error) {
        console.error('The following error occurred: ' + error);
      }, true);
    }
  }

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
