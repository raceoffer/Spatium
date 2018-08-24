import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { SettingsService } from '../../services/settings.service';
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
    private readonly navigationService: NavigationService,
    private readonly settings: SettingsService,
  ) {}

  public async ngOnInit() {
    await this.deviceService.deviceReady();

    const viewed = await this.settings.presentationViewed();
    if (!viewed) {
      this.openPresentation();
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

    const startPath = await this.settings.startPath();
    if (startPath !== null) {
      await this.router.navigate([startPath as string]);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public openPresentation() {
    const componentRef = this.navigationService.pushOverlay(PresentationComponent, Position.Fullscreen);
    componentRef.instance.finished.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.settings.setPresentationViewed(true);
    });
    componentRef.instance.skipped.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.settings.setPresentationViewed(true);
    });
  }

  public async onOpenClicked() {
    try {
      await this.settings.setStartPath('/login');
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/login']);
  }

  public async onConnectClicked() {
    try {
      await this.settings.setStartPath('/verifier-auth');
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/verifier-auth']);
  }
}
