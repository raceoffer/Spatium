import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { getValue, setValue } from '../../utils/storage';
import { PresentationComponent } from '../presentation/presentation.component';

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
  private subscriptions = [];

  constructor(private readonly deviceService: DeviceService,
              private readonly router: Router,
              private readonly ngZone: NgZone,
              private readonly navigationService: NavigationService) {}

  async ngOnInit() {
    await this.deviceService.deviceReady();

    // if (this.deviceService.platform === Platform.Android) {
      try {
        await getValue('presentation');
      } catch (ignored) {
        this.navigationService.pushOverlay(PresentationComponent, Position.Fullscreen);
      }
    // }

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
        await this.eventOnBackClicked();
      })
    );

    if (this.isWindows) {
      const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
      currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
    }

    try {
      const startPath = await getValue('startPath');
      this.ngZone.run(async () => {
        await this.router.navigate([startPath]);
      });
    } catch (e) {

    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onOpenClicked() {
    await setValue('startPath', '/login');
    await this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    await setValue('startPath', '/verifier-auth');
    await this.router.navigate(['/verifier-auth']);
  }

  eventOnBackClicked() {
    navigator.app.exitApp();
  }
}
