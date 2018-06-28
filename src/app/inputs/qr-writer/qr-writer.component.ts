import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DeviceService, Platform } from "../../services/device.service";
import { NotificationService } from "../../services/notification.service";

declare const cordova: any;
declare const window: any;

@Component({
  selector: 'app-qr-writer',
  templateUrl: './qr-writer.component.html',
  styleUrls: ['./qr-writer.component.css']
})
export class QrWriterComponent implements OnInit {
  @Input() public value: string = null;
  @Output() public saved = new EventEmitter<any>();

  constructor(
    private readonly deviceService: DeviceService,
    private readonly notification: NotificationService
  ) { }

  public async ngOnInit() {
    await this.ensurePermission();
  }

  public async onSave() {
    await this.ensurePermission();

    const canvas = document.getElementsByTagName('canvas')[0];

    try {
      await this.saveCanvas(canvas);

      this.saved.next(this.value);
    } catch (ignored) {
      this.notification.show('Failed to save the QR image')
    }
  }

  public async ensurePermission() {
    let hasPermission = true;
    if (this.deviceService.platform !== Platform.Windows) {
      hasPermission = await this.hasPermission();
    }

    if (!hasPermission) {
      if(!await this.requestPermission()) {
        this.notification.show('Failed to acquire a permission to save the QR image');
        return false;
      }
    }

    return hasPermission;
  }

  public async hasPermission() {
    return await new Promise<boolean>((resolve, reject) => {
      cordova.plugins.permissions.checkPermission(
        cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE,
        status => resolve(status.hasPermission),
        reject);
    });
  }

  public async requestPermission() {
    return await new Promise<boolean>((resolve, reject) => {
      cordova.plugins.permissions.requestPermission(
        cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE,
        status => resolve(status.hasPermission),
        reject);
    });
  }

  public async saveCanvas(canvas) {
    return await new Promise((resolve, reject) => {
      window.canvas2ImagePlugin.saveImageDataToLibrary(
        resolve,
        reject,
        canvas
      );
    });
  }
}
