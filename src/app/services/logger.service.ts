import { Injectable } from '@angular/core';

declare const window: any;

@Injectable()
export class LoggerService {
  public static log(message, data) {
    window.fabric.Crashlytics.addLog(message + ': ' + JSON.stringify(data));
    console.log(message, JSON.stringify(data));
  }

  public static nonFatalCrash(message, exception) {
    window.fabric.Crashlytics.sendNonFatalCrash(message + ': ' + exception);
    console.log(message, exception);
  }
}
