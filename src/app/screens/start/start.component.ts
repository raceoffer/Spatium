import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { WalletService } from '../../services/wallet.service';
import { KeyChainService } from '../../services/keychain.service';
import { BluetoothService } from '../../services/bluetooth.service';
import { NavigationService } from '../../services/navigation.service';

declare const navigator: any;

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
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async (e) => {
        await this.eventOnBackClicked(e);
      })
    );

    await this.bt.disconnect();
    await this.wallet.reset();
    this.keychain.reset();
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

    await this.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['pincode', { next: 'waiting' }] } }]);
  }

  async onWClicked() {
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['wallet'] } }]);
  }

  eventOnBackClicked(e) {
    e.preventDefault();
    navigator.app.exitApp();
  }
}
