import { Component, OnDestroy, OnInit } from '@angular/core';
import { DeviceService } from './services/device.service';
import { FileService } from './services/file.service';
import { LoggerService } from './services/logger.service';
import {HockeyService} from './services/hockey.service';

declare const hockeyapp: any;
declare const navigator: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Spatium Wallet app';
  message = 'Loading...';
  private subscriptions = [];
  time = 180000;
  timer = setTimeout(() => {
    navigator.app.exitApp();
  }, this.time);

  constructor(private readonly fs: FileService,
              private readonly logger: LoggerService,
              private readonly deviceService: DeviceService,
              private readonly hockeyService: HockeyService) { }

  ngOnInit() {
    this.init();

  timerUpdate() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      navigator.app.exitApp();
    }, this.time);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  private async init() {
    await this.deviceService.deviceReady();

    this.subscriptions.push(
      this.fs.createLogFileEvent.subscribe(async () => {
        await this.logger.logBufferToLog();
      }));

    await this.logger.createSessionLog();
    this.logger.deleteOldLogFiles();
    hockeyapp.start(null, null, this.hockeyService.appId, true, hockeyapp.CHECK_MANUALLY, false, true);
  }
}
