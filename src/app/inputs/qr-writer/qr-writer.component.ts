import { Component, EventEmitter, Input, AfterViewInit, Output } from '@angular/core';
import { DeviceService, Platform } from "../../services/device.service";
import { NotificationService } from "../../services/notification.service";
import { checkPermission, Permission, requestPermission } from "../../utils/permissions";

declare const window: any;

@Component({
  selector: 'app-qr-writer',
  templateUrl: './qr-writer.component.html',
  styleUrls: ['./qr-writer.component.css']
})
export class QrWriterComponent implements AfterViewInit {
  @Input() public value: string = null;
  @Output() public saved = new EventEmitter<any>();

  constructor(
    private readonly deviceService: DeviceService,
    private readonly notification: NotificationService
  ) { }

  async ngAfterViewInit() {
    if (this.deviceService.platform !== Platform.Windows && !await checkPermission(Permission.Storage)) {
      await requestPermission(Permission.Storage);
    }
  }

  public async onSave() {
    if (this.deviceService.platform !== Platform.Windows && !await checkPermission(Permission.Storage)) {
      await requestPermission(Permission.Storage);
    } else {
      const canvas = document.getElementsByTagName('canvas')[0];

      try {
        await this.saveCanvas(canvas);

        this.saved.next(this.value);
      } catch (ignored) {
        const message = this.deviceService.platform === Platform.IOS ? 
          "To grant Spatium permission to save Qr codes, go to Settings -> Spatium -> Allow Spatium to access Photos" :
          'Failed to save the QR image';
        this.notification.show(message);
      }
    }
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
