import { Component, ComponentRef, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NavigationService } from '../../services/navigation.service';
import { DeviceService } from '../../services/device.service';
import { Overlay, OverlayConfig } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { NfcAuthFactorComponent } from "../authorization-factors/nfc-auth-factor/nfc-auth-factor.component";

declare const navigator: any;
declare const device: any;
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
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly navigationService: NavigationService,
    private readonly overlay: Overlay) {}

  async ngOnInit() {
    await this.deviceService.deviceReady();

    this.ready = true;
    this.isWindows = device.platform === 'windows';

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
    try {
      this.authService.encryptedSeed = await this.fs.readFile(this.fs.safeFileName('seed'));
    } catch (e) {
      this.authService.encryptedSeed = null;
    }

    await this.router.navigate(['/confirmation-entry', {back: 'start'}]);
  }

  async onTest() {
    const config = new OverlayConfig();

    config.height = '100%';
    config.width = '100%';

    const overlayRef = this.overlay.create(config);
    const loginPortal = new ComponentPortal(NfcAuthFactorComponent);
    const componentRef: ComponentRef<NfcAuthFactorComponent> = overlayRef.attach(loginPortal);
    componentRef.instance.submit.subscribe((value) => {
      console.log(value);
      overlayRef.dispose();
    });
    componentRef.instance.back.subscribe((value) => {
      overlayRef.dispose();
    })

  }

  eventOnBackClicked(e) {
    e.preventDefault();
    navigator.app.exitApp();
  }
}
