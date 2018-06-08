import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { FileService } from './file.service';

declare const cordova: any;
declare const device: any;
declare const window: any;
declare const hockeyapp: any;

export enum LoggerLevels {
  ALL = 0,
  LOG,
  DEBUG,
  INFO,
  WARN,
  ERROR
}

@Injectable()
export class LoggerService {


  logLevel = LoggerLevels.ALL;
  sessionlogPath = '';
  sessionlogName = '';
  logBuffer = '';

  constructor(private readonly fs: FileService) {
    console.log = this.proxy(console, console.log, '[LOG]', LoggerLevels.LOG);
    console.debug = this.proxy(console, console.debug, '[DEBUG]', LoggerLevels.DEBUG);
    console.info = this.proxy(console, console.info, '[INFO]', LoggerLevels.INFO);
    console.warn = this.proxy(console, console.warn, '[WARN]', LoggerLevels.WARN);
    console.error = this.proxy(console, console.error, '[ERROR]', LoggerLevels.ERROR);
  }

  public static log(message, data) {
    window.fabric.Crashlytics.addLog(message + ': ' + JSON.stringify(data));
    console.log(message, JSON.stringify(data));
  }

  public static nonFatalCrash(message, exception) {
    window.fabric.Crashlytics.sendNonFatalCrash(message + ': ' + exception);
    console.log(message, exception);
  }

  proxy(context, method, message, level) {
    const datePipe = new DatePipe('en-US');
    const format = 'yyyy-MM-ddTHH:mm:ss.SSS z';

    return (...args) => {
      const datelog = datePipe.transform(new Date(), format);
      const log = '[' + datelog + '] ' + message;
      const text = [log].concat(args);

      method.apply(context, text);

      try {
        if (level.valueOf() >= this.logLevel.valueOf() && this.fs.hasLogFile) {
          if (this.logBuffer != null) {
            this.fs.writeToFileLog(this.sessionlogPath, this.sessionlogName, this.logBuffer + text.concat(['\n']).toString());
            this.logBuffer = null;
          } else {
            this.fs.writeToFileLog(this.sessionlogPath, this.sessionlogName, text.concat(['\n']));
          }
        } else {
          this.logBuffer = this.logBuffer + text.concat(['\n']).toString();
        }
      } catch (e) {
      }
    }
  }

  async createSessionLog() {
    var datePipe = new DatePipe('en-US');
    const format = 'yyyy-MM-ddTHH-mm-ss';
    const datelog = datePipe.transform(new Date(), format);
    this.sessionlogName = this.fs.logFileName(datelog);
    this.sessionlogPath = this.fs.getExternalPath();

    await this.fs.writeFileLog(this.sessionlogPath, this.sessionlogName, '');
  }
}
