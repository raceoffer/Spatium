import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { MatSnackBar, MatSnackBarRef } from '@angular/material';
import { DeviceService } from './device.service';

declare const cordova: any;

@Injectable()
export class NotificationService {
  public confirm: Subject<any> = new Subject<any>();
  public decline: Subject<any> = new Subject<any>();
  snackBarRef: MatSnackBarRef<any>;

  constructor(private readonly deviceService: DeviceService,
              private readonly ngZone: NgZone,
              private snackBar: MatSnackBar) {
    this.init();
  }

  public askConfirmation(title: string, text: string) {
    cordova.plugins.notification.local.schedule({
      title: title,
      text: text,
      icon: 'res://icon',
      smallIcon: 'res://ic_stat_res',
      foreground: true,
      actions: [
        {id: 'confirm', title: 'Confirm'},
        {id: 'decline', title: 'Decline'}
      ]
    });
  }

  public cancelConfirmation() {
    cordova.plugins.notification.local.cancel(0);
  }

  public show(message: string) {
    this.snackBarRef = this.snackBar.open(message, 'Dismiss', {duration: 3000});

    this.snackBarRef.onAction().subscribe(() => {
      this.snackBarRef.dismiss();
    });
  }

  public hide() {
    this.snackBar.dismiss();
  }

  private async init() {
    await this.deviceService.deviceReady();

    cordova.plugins.notification.local.on('confirm', (notification, eopts) => this.ngZone.run(() => {
      this.confirm.next();
    }));
    cordova.plugins.notification.local.on('decline', (notification, eopts) => this.ngZone.run(() => {
      this.decline.next();
    }));
  }
}
