import { Component, OnDestroy, OnInit } from '@angular/core';
import { DeviceService } from './services/device.service';
import { FileService } from './services/file.service';
import { LoggerService } from './services/logger.service';

declare const hockeyapp: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Spatium Wallet app';
  message = 'Loading...';
  private subscriptions = [];

  constructor(private readonly fs: FileService,
              private readonly logger: LoggerService,
              private readonly deviceService: DeviceService) { }

  ngOnInit() {
    this.init();
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
    // TODO: Pass AppId according to a platform
    hockeyapp.start(null, null, '6a66e9dc6499491187e1bb8c3bfeced9', true, hockeyapp.CHECK_MANUALLY, false, true);
  }
}
