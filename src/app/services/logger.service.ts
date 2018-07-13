import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { FileService } from './file.service';
import { stringify } from 'flatted/esm';

declare const cordova: any;
declare const device: any;
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
  private sessionlogPath = '';
  private sessionlogName = '';
  private logBuffer = '';


  constructor(private readonly fs: FileService) {
    console.debug = this.proxy(console, console.debug, '[DEBUG]', LoggerLevels.DEBUG);
    console.log = this.proxy(console, console.log, '[LOG]', LoggerLevels.LOG);
    console.info = this.proxy(console, console.info, '[INFO]', LoggerLevels.INFO);
    console.warn = this.proxy(console, console.warn, '[WARN]', LoggerLevels.WARN);
    console.error = this.proxy(console, console.error, '[ERROR]', LoggerLevels.ERROR);
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

    return (...args) => {
      const datelog = datePipe.transform(new Date(), format);
      const log = '[' + datelog + '] ' + message;
      const text = [log].concat(args);

      method.apply(context, text);

      let textForLogger = text[0];
      var i;
      for (i = 1; i < text.length; i++) {
        textForLogger = textForLogger + ' ' + this.convertToString(text[i]);
      }
      textForLogger = textForLogger + '\n';

      try {
        if ((level.valueOf() >= this.logLevel.valueOf()) && this.fs.hasLogFile.getValue()) {
          if (this.logBuffer != null) {
            this.logBuffer = this.logBuffer + textForLogger;
            this.fs.writeToFileLog(this.sessionlogPath, this.sessionlogName, this.logBuffer);
            this.logBuffer = null;
          } else {
            this.fs.writeToFileLog(this.sessionlogPath, this.sessionlogName, textForLogger);
          }
        } else {
          this.logBuffer = this.logBuffer + textForLogger;
        }
      } catch (e) {
      }
    }
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
    this.sessionlogPath = await this.fs.getLogPath();

    await this.fs.writeFileLog(this.sessionlogPath, this.sessionlogName, '');
  }

  async logBufferToLog() {
    await this.fs.writeFileLog(this.sessionlogPath, this.sessionlogName, this.logBuffer);
    this.logBuffer = null;
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
    }
    else {
      return null;
    }
  }

  get logFileName(): string {
    return this.sessionlogName;
  }

  async deleteOldLogFiles() {
    await this.fs.deleteOldLogFiles();
  }
}
