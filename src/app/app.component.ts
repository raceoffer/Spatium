import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { DeviceService } from './services/device.service';
import { FileService } from './services/file.service';
import { LoggerService } from './services/logger.service';
import { HockeyService } from './services/hockey.service';
import { ActivityService } from "./services/activity.service";

declare const hockeyapp: any;
declare const navigator: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  @HostListener('document:click', ['$event'])
  onClick(ev:MouseEvent) {
    this.onActivity();
    console.log(`onClick ${JSON.stringify(ev)}!`);
  }
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(ev:MouseEvent) {
    this.onActivity();
    console.log(`onMouseMove ${JSON.stringify(ev)}!`);
  }
  @HostListener('document:mousedown', ['$event'])
  onMouseDown(ev:MouseEvent) {
    this.onActivity();
    console.log(`onMouseDown ${JSON.stringify(ev)}!`);
  }
  @HostListener('document:keyup', ['$event'])
  onKeyUp(ev:KeyboardEvent) {
    this.onActivity();
    console.log(`The user just pressed ${ev.key}!`);
  }
  @HostListener('document:keypress', ['$event'])
  onKeyPress(ev:KeyboardEvent) {
    this.onActivity();
    console.log(`The user just pressed ${ev.key}!`);
  }
  @HostListener('document:scroll', ['$event'])
  onScroll(ev:UIEvent) {
    this.onActivity();
    console.log(`onScroll ${JSON.stringify(ev)}!`);
  }

  constructor(
    private readonly fs: FileService,
    private readonly logger: LoggerService,
    private readonly deviceService: DeviceService,
    private readonly hockeyService: HockeyService,
    private readonly activityService: ActivityService
  ) { }

  async ngOnInit() {
    await this.deviceService.deviceReady();

    this.subscriptions.push(
      this.fs.createLogFileEvent.subscribe(async () => {
        await this.logger.logBufferToLog();
      }));

    const lastLogData = await this.logger.getLastLogData();
    await this.logger.createSessionLog();
    await this.logger.deleteOldLogFiles();
    hockeyapp.start(null, null, this.hockeyService.appId, true, hockeyapp.CHECK_MANUALLY, false, true);
    if (lastLogData) {
      hockeyapp.addMetaData(null, null, lastLogData);
    }
  }

  onActivity() {
    this.activityService.onActivity();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
