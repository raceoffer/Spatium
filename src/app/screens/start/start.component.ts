import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService } from '../../services/navigation.service';
import { PresentationComponent } from '../presentation/presentation.component';

declare const navigator: any;
declare const Windows: any;
declare const NativeStorage: any;

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

    NativeStorage.remove('startPath');

    if (this.deviceService.platform === Platform.Android) {
      NativeStorage.getItem('presentation',
        (value) => {},
        (error) => this.ngZone.run(async () => {
          const componentRef = this.navigationService.pushOverlay(PresentationComponent, true);
        })
      );
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
    NativeStorage.setItem('startPath', '/login');
    await this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    NativeStorage.setItem('startPath', '/verifier-auth');
    await this.router.navigate(['/verifier-auth']);
  }

  eventOnBackClicked(e) {
    e.preventDefault();
    navigator.app.exitApp();
  }
}
