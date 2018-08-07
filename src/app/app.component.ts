import { Component, OnDestroy, OnInit } from '@angular/core';
import { DeviceService } from './services/device.service';
import { FileService } from './services/file.service';
import { LoggerService } from './services/logger.service';
import { HockeyService } from './services/hockey.service';

declare const hockeyapp: any;
declare const navigator: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {


  constructor(private readonly logger: LoggerService,
              private readonly deviceService: DeviceService,
              private readonly hockeyService: HockeyService) { }

  async ngOnInit() {
    this.deviceService.deviceReady().then(async () => {
      hockeyapp.start(null, null, this.hockeyService.appId, true, null, false, true);

      const lastLogData = await this.logger.getLastLogData();
      await this.logger.createSessionLog();
      await this.logger.deleteOldLogFiles();
      if (lastLogData) {
        hockeyapp.addMetaData(null, null, lastLogData);
      }
    });
  }
}
