import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { FileService } from './file.service';
import { stringify } from 'flatted/esm';
import { DeviceService } from './device.service';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { buffer, filter } from 'rxjs/operators';

declare const cordova: any;
declare const window: any;
declare const hockeyapp: any;

export enum LoggerLevels {
  ALL = 0,
  DEBUG,
  LOG,
  INFO,
  WARN,
  ERROR
}

@Injectable()
export class LoggerService {
  private logLevel = LoggerLevels.LOG;

  private sessionlogName = '';

  private busySubject = new BehaviorSubject<boolean>(true);
  private logSubject = new Subject<string>();
  private logBuffer = this.logSubject.pipe(
    buffer(combineLatest(
      this.logSubject,
      this.busySubject
    ).pipe(
      filter(([newMessage, busy]) => {
        return !busy;
      })
    )),
    filter(strings => strings.length > 0)
  );

  constructor(
    private readonly fs: FileService,
    private readonly ds: DeviceService
  ) {
    console.log = this.proxy(console, console.log, '[LOG]', LoggerLevels.LOG);
    console.info = this.proxy(console, console.info, '[INFO]', LoggerLevels.INFO);
    console.warn = this.proxy(console, console.warn, '[WARN]', LoggerLevels.WARN);
    console.error = this.proxy(console, console.error, '[ERROR]', LoggerLevels.ERROR);

    this.logBuffer.subscribe(async (strings) => {
      this.busySubject.next(true);

      await this.fs.writeToFile(this.sessionlogName, strings);

      this.busySubject.next(false);
    });

    window.onerror = message => {
      const datePipe = new DatePipe('en-US');
      const format = 'yyyy-MM-ddTHH:mm:ss.SSS z';

      const datelog = datePipe.transform(new Date(), format);
      const log = '[' + datelog + '] ' + '[UNCAUGHT ERROR] ' + message + '\n';

      this.logSubject.next(log);
    };
  }

  get logFileName(): string {
    return this.sessionlogName;
  }

  public static log(message, data) {
    // TODO: send log to hockey
    console.log(message, JSON.stringify(data));
  }

  public static nonFatalCrash(message, exception) {
    // TODO: send crash to hockey
    console.log(message, exception);
  }

  proxy(context, method, message: string, level: LoggerLevels) {
    const datePipe = new DatePipe('en-US');
    const format = 'yyyy-MM-ddTHH:mm:ss.SSS z';

    return async (...args) => {
      const datelog = datePipe.transform(new Date(), format);
      const log = '[' + datelog + '] ' + message;
      const text = [log].concat(args);

      method.apply(context, text);

      let textForLogger = text[0];
      for (let i = 1; i < text.length; i++) {
        textForLogger = textForLogger + ' ' + this.convertToString(text[i]);
      }
      textForLogger = textForLogger + '\n';

      try {
        if ((level.valueOf() >= this.logLevel.valueOf())) {
          this.logSubject.next(textForLogger);
        }
      } catch (e) {
        console.debug(e);
      }
    };
  }

  convertToString(obj) {
    if (!obj) {
      return obj;
    }

    if (typeof obj === 'string') {
      return obj;
    }

    if (obj.constructor && obj.constructor.name === 'DebugContext_') {
      return 'DebugContext_';
    }

    if (obj.name && obj.name === 'Error') {
      return obj;
    }

    if (obj.constructor && obj.constructor.name === 'Error') {
      return obj;
    }

    return stringify(obj);
  }

  async createSessionLog() {
    const datePipe = new DatePipe('en-US');
    const format = 'yyyy-MM-ddTHH-mm-ss';
    const datelog = datePipe.transform(new Date(), format);

    this.sessionlogName = this.fs.logFileName(datelog);

    let info = [];
    try {
      const deviceInfo = await this.ds.getDeviceInfo();
      info = info.concat(deviceInfo);

      const appInfo = await this.ds.getAppInfo();
      info = info.concat(appInfo);
    } catch (e) {
      console.debug(e);
    }

    // Write the header
    await this.fs.writeFile(this.sessionlogName, info);

    // Mark logging ready
    this.busySubject.next(false);
  }

  async getLogData(): Promise<string> {
    return await this.fs.readFile(this.sessionlogName);
  }

  async getLastLogData(): Promise<string | null> {
    const lastLogFileName = (await this.fs.listFiles())
      .filter(name => name.includes('log_'))
      .sort()
      .pop();
    if (lastLogFileName) {
      return await this.fs.readFile(lastLogFileName);
    } else {
      return null;
    }
  }

  async deleteOldLogFiles() {
    await this.fs.deleteOldLogFiles();
  }
}
