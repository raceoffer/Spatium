import { Component, OnDestroy, OnInit, HostListener, NgZone } from '@angular/core';
import { DeviceService } from './services/device.service';
import { FileService } from './services/file.service';
import { LoggerService } from './services/logger.service';
import { HockeyService } from './services/hockey.service';
import { ActivityService } from './services/activity.service';
import { Router } from "@angular/router";

declare const hockeyapp: any;
declare const navigator: any;
declare const NativeStorage: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  @HostListener('document:click', ['$event'])
  onClick(ev: MouseEvent) {
    this.onActivity();
  }
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(ev: MouseEvent) {
    this.onActivity();
  }
  @HostListener('document:mousedown', ['$event'])
  onMouseDown(ev: MouseEvent) {
    this.onActivity();
  }
  @HostListener('document:keyup', ['$event'])
  onKeyUp(ev: KeyboardEvent) {
    this.onActivity();
  }
  @HostListener('document:keypress', ['$event'])
  onKeyPress(ev: KeyboardEvent) {
    this.onActivity();
  }
  @HostListener('document:scroll', ['$event'])
  onScroll(ev: UIEvent) {
    this.onActivity();
  }

  constructor(
    private readonly fs: FileService,
    private readonly ngZone: NgZone,
    private readonly router: Router,
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

    NativeStorage.getItem('startPath',
      (value) => this.ngZone.run(async () => {
        await this.router.navigate([value]);
      })
    );

    const lastLogData = await this.logger.getLastLogData();
    await this.logger.createSessionLog();
    await this.logger.deleteOldLogFiles();
    hockeyapp.start(null, null, this.hockeyService.appId, true, null, false, true);
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
