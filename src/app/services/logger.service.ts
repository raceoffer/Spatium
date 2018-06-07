import { DatePipe } from "@angular/common";
import { Injectable } from '@angular/core';
import { FileService } from "./file.service";

declare const cordova: any;
declare const device: any;
declare const window: any;
declare const hockeyapp: any;

@Injectable()
export class LoggerService {

  constructor(private readonly fs: FileService) {
    var console = ((oldCons) => {
      var datePipe = new DatePipe('en-US');
      const format = 'yyyy-MM-ddTHH:mm:ss.SSS z';

      return {
        log: (text, msg) => {
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [LOG] ';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        debug: (text, msg) => {
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [DEBUG] ';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        info: (text, msg) => {
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [INFO] ';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        warn: (text, msg) => {
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [WARN] ';
          oldCons.log(prefix + text, msg);
          // Your code
        },
        error: async (text, msg) => {
          const now = datePipe.transform(new Date(), format);
          const prefix = '[' + now + '] [ERROR] ';
          oldCons.log(prefix + text, msg);
/*          await this.fs.writeFile(this.fs.safeFileName('log'), prefix + text);
          const file = await this.fs.getFile(this.fs.safeFileName('log'));
          oldCons.log(file);*/
          if (!this.isWindows()) {
            hockeyapp.addMetaData(function () {}, function () {}, 'jdashkdjashdkjsadah');
            hockeyapp.forceCrash();
          } else {
            
          }
          // Your code
        }
      };
    })(window.console);

    window.console = console;
  }

  isWindows(): boolean {
    return device.platform === 'windows';
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
