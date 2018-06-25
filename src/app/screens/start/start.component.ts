import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { DeviceService, Platform } from '../../services/device.service';

declare const navigator: any;
declare const Windows: any;
declare const NativeStorage: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  public ready = false;
  public isWindows = null;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly navigationService: NavigationService,
    private readonly ngZone: NgZone
  ) {}

  async ngOnInit() {
    await this.deviceService.deviceReady();
    NativeStorage.remove('startPath');

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
      this.navigationService.backEvent.subscribe(async (e) => {
        await this.eventOnBackClicked(e);
      })
    );

    if (this.isWindows) {
      const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
      currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onOpenClicked() {
    this.navigate(
      'loginPresentation',
      '/login-presentation',
      '/login'
    );
  }

  async onConnectClicked() {
    this.navigate(
      'confirmationPresentation',
      '/confirmation-presentation',
      '/verifier-create'
    );
  }

  eventOnBackClicked(e) {
    e.preventDefault();
    navigator.app.exitApp();
  }

  async navigate(storageName, presenatationPath, pagePath) {
    NativeStorage.getItem(storageName,
      (value) => this.ngZone.run(async () => {
        NativeStorage.setItem('startPath', pagePath);
        await this.router.navigate([pagePath]);
      }),
      (error) => this.ngZone.run(async () => {
        await this.router.navigate([presenatationPath]);
      }),
    );
  }
}
