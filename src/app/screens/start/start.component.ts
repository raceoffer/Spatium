import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { WalletService } from '../../services/wallet.service';
import { KeyChainService } from '../../services/keychain.service';
import { BluetoothService } from '../../services/bluetooth.service';
import { NavigationService } from '../../services/navigation.service';

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

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly wallet: WalletService,
    private readonly keychain: KeyChainService,
    private readonly bt: BluetoothService,
    private readonly navigationService: NavigationService
  ) {}

  async ngOnInit() {
    if (this.isWindows()) {
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

    await this.bt.disconnect();
    await this.wallet.reset();
    this.keychain.reset();

    if (this.isWindows()) {
      const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
      currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  isWindows(): boolean {
    return device.platform === 'windows';
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

    await this.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['pincode', { next: 'waiting' }] } }]);
  }

  eventOnBackClicked(e) {
    e.preventDefault();
    navigator.app.exitApp();
  }
}
