import { Component, EventEmitter, OnInit, Output } from '@angular/core';

declare const cordova: any;
declare const window: any;

@Component({
  selector: 'app-qr-reader',
  templateUrl: './qr-reader.component.html',
  styleUrls: ['./qr-reader.component.css']
})
export class QrReaderComponent implements OnInit {
  @Output() scanned: EventEmitter<string> = new EventEmitter<string>();
  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() error: EventEmitter<any> = new EventEmitter<any>();

  async ngOnInit() {
    if (!await this.checkPermissions()) {
      await this.requestPermission();
    }
  }

  async checkPermissions() {
    return await new Promise<boolean>((resolve, reject) =>
      cordova.plugins.permissions.checkPermission(
        cordova.plugins.permissions.CAMERA,
        status => resolve(status.hasPermission),
        reject));
  }

  async requestPermission() {
    return await new Promise((resolve, reject) =>
      cordova.plugins.permissions.requestPermission(
        cordova.plugins.permissions.CAMERA,
        resolve,
        reject));
  }

  async scan() {
    return await new Promise<any>((resolve, reject) => cordova.plugins.barcodeScanner.scan(
      resolve,
      reject,
      {
        preferFrontCamera : false, // iOS and Android
        showFlipCameraButton : true, // iOS and Android
        showTorchButton : true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: false, // Android, save scan history (default false)
        prompt : 'Place a barcode inside the scan area', // Android
        resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        disableAnimations : true, // iOS
        disableSuccessBeep: false // iOS and Android
      }
    ));
  }

  async onScan() {
    if (!await this.checkPermissions()) {
      await this.requestPermission();
    } else {
      try {
        const result = await this.scan();
        if (!result.cancelled) {
          this.scanned.next(result.text);
        } else {
          this.cancelled.next();
        }
      } catch(e) {
        this.error.next(e);
      }
    }
  }
}
