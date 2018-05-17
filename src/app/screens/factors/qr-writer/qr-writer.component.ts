import { Component, EventEmitter, HostBinding, Input, NgZone, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FactorType } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

declare const cordova: any;
declare const device: any;
declare const window: any;
declare const Buffer: any;

@Component({
  selector: 'app-qr-writer',
  templateUrl: './qr-writer.component.html',
  styleUrls: ['./qr-writer.component.css']
})
export class QrWriterComponent implements OnInit {

  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() isExport = false;
  @Input() isAuth = false;
  @Input() secretValue = '';
  value: BehaviorSubject<string> = null;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  permissionCStorage = false;

  constructor(private readonly ngZone: NgZone,
              private readonly notification: NotificationService) { }

  async ngOnInit() {}

  async saveQr() {
    if (this.isWindows()) {
      this.permissionCStorage = true;
      this.saveToStorage();
    } else {
      this.requestStorage();
    }
  }

  requestStorage() {
    const permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, (status) => this.ngZone.run(() => {
      if (status.hasPermission) {
        this.permissionCStorage = true;
        this.saveToStorage();
      } else {
        this.permissionCStorage = false;

        permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, this.successStorage.bind(this), this.errorStorage.bind(this));
      }
    }));
  }

  successStorage(status) {
    if (!status.hasPermission) {
      this.notification.show('Storage permission is not turned on');
      this.ngZone.run(async () => {
        this.permissionCStorage = false;
      });
    } else {
      this.ngZone.run(async () => {
        this.permissionCStorage = true;
        this.saveToStorage();
      });
    }
  }

  errorStorage() {
    this.notification.show('Storage permission is not turned on');
  }

  saveToStorage() {
    console.log(this.permissionCStorage);
    if (this.permissionCStorage) {
      const canvas = document.getElementsByTagName('canvas')[0];
      window.canvas2ImagePlugin.saveImageDataToLibrary(
        function (msg) {
          console.log(msg);
          this.notification.show('Secret has been saved as QR image');
        }.bind(this),
        function (err) {
          console.log(err);
        },
        canvas
      );
    }
  }

  async onNext() {
    this.onSuccess.emit({factor: FactorType.QR, value: this.value.getValue()});
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }
}
