import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { getValue, setValue } from '../../utils/storage';
import { PresentationComponent } from '../presentation/presentation.component';
import { KeyChainService } from '../../services/keychain.service';
import { LoggerService } from '../../services/logger.service';

declare const navigator: any;
declare const Windows: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit, OnDestroy {
  public ready = false;
  public isWindows = null;
  private buffer = null;
  private subscriptions = [];

  constructor(
    private readonly deviceService: DeviceService,
    private readonly logger: LoggerService,
    private readonly keyChainService: KeyChainService,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly navigationService: NavigationService
  ) {}

  async ngOnInit() {
    await this.deviceService.deviceReady();

    if(!getValue('presentation.viewed')) {
	  this.navigationService.pushOverlay(PresentationComponent, Position.Fullscreen);
    }

    this.ready = true;
    this.isWindows = this.deviceService.platform === Platform.Windows;

    if (this.isWindows) {
      this.router.events
        .subscribe((event) => {
          if (event instanceof NavigationStart) {
            const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
            currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.visible;
          }
        });
    }

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        navigator.app.exitApp();
      })
    );

    if (this.isWindows) {
      const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
      currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
    }

    this.buffer = Buffer;
    this.keyChainService.reset();

    const startPath = getValue('startPath');
    if (startPath) {
      this.ngZone.run(async () => {
        await this.router.navigate([startPath]);
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onOpenClicked() {
    setValue('startPath', '/login');
    await this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    setValue('startPath', '/verifier-auth');
    await this.router.navigate(['/verifier-auth']);
  }
  }
