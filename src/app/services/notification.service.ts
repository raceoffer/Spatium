import { Injectable } from '@angular/core';

declare const window: any;

@Injectable()
export class NotificationService {
  constructor() { }

  show(message: string) {
    window.plugins.toast.showLongBottom(message, 3000, message, console.log(message));
  }
}
