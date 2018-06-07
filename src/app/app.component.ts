import { Component, OnInit } from '@angular/core';
import { LoggerService } from "./services/logger.service";
import { DeviceService } from "./services/device.service";

declare const hockeyapp: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';

  constructor(private readonly logger: LoggerService,
              private readonly deviceService: DeviceService) {

  }

  ngOnInit() {
    this.init();
  }

  private async init() {
    await this.deviceService.deviceReady();

    hockeyapp.start(null, null, '6a66e9dc6499491187e1bb8c3bfeced9', true, hockeyapp.CHECK_MANUALLY, false, true);
  }
}
