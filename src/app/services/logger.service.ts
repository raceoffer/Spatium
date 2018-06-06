import { Injectable } from '@angular/core';
import { DatePipe } from "@angular/common";

declare const window: any;

@Injectable()
export class LoggerService {

  constructor() {
    var console = (function(oldCons){
      var datePipe = new DatePipe('en-US');
      const format = 'yyyy-MM-ddTHH:mm:ss.SSS z';

      return {
        log: function(text, msg){
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [LOG] ';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        debug: function(text, msg){
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [DEBUG]';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        info: function(text, msg){
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [INFO]';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        warn: function(text, msg){
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [WARN]';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        error: function(text, msg){
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [ERROR]';
          oldCons.log(prefix + text, msg);
          // Your code
        }
      };
    }(window.console));

    window.console = console;
  }

  public static log(message, data) {

    window.fabric.Crashlytics.addLog(message + ': ' + JSON.stringify(data));
    console.log(message, JSON.stringify(data));
  }

  public static nonFatalCrash(message, exception) {
    window.fabric.Crashlytics.sendNonFatalCrash(message + ': ' + exception);
    console.log(message, exception);
  }
}
