import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { MatSnackBar, MatSnackBarRef } from '@angular/material';
import { DeviceService } from './device.service';

declare const cordova: any;

@Injectable()
export class NotificationService {
  public confirm: Subject<number> = new Subject<number>();
  public decline: Subject<number> = new Subject<number>();

  private baseId = 1;

  private snackBarRef: MatSnackBarRef<any>;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly ngZone: NgZone,
    private snackBar: MatSnackBar
  ) {
    this.deviceService.deviceReady().then(() => {
      if (cordova.plugins.notification) {
        cordova.plugins.notification.local.on('confirm', (notification, eopts) => this.ngZone.run(() => {
          this.confirm.next(notification.id);
        }));
        cordova.plugins.notification.local.on('decline', (notification, eopts) => this.ngZone.run(() => {
          this.decline.next(notification.id);
        }));
      }
    });
  }

  public askConfirmation(title: string, text: string): number {
    const id = this.baseId++;
    if (cordova.plugins.notification) {
      cordova.plugins.notification.local.schedule({
        id: id,
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
    return id;
  }

  public cancelConfirmation(id: number) {
    if (cordova.plugins.notification) {
      cordova.plugins.notification.local.cancel(id);
    }
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
}
