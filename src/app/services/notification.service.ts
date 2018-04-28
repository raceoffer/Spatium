import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs/Subject';

declare const window: any;
declare const cordova: any;

@Injectable()
export class NotificationService {
  public confirm: Subject<any> = new Subject<any>();
  public decline: Subject<any> = new Subject<any>();

  constructor(private readonly ngZone: NgZone) {
    cordova.plugins.notification.local.on('confirm', (notification, eopts) => this.ngZone.run(() => {
      this.confirm.next();
    }));
    cordova.plugins.notification.local.on('decline', (notification, eopts) => this.ngZone.run(() => {
      this.decline.next();
    }));
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

  public show(message: string) {
    window.plugins.toast.showLongBottom(message, 3000, message, console.log(message));
  }

  public hide() {
    window.plugins.toast.hide();
  }
}
