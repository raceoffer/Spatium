import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { DeviceService, Platform } from '../../services/device.service';
import { ActivityService } from "../../services/activity.service";

declare const navigator: any;
declare const Windows: any;

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
    private readonly navigationService: NavigationService
  ) {}

  async ngOnInit() {
    await this.deviceService.deviceReady();

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
    await this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    await this.router.navigate(['/verifier-create']);
  }

  eventOnBackClicked(e) {
    e.preventDefault();
    navigator.app.exitApp();
  }
}
