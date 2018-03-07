import {Component, NgZone, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { WalletService } from '../../services/wallet.service';
import { KeyChainService } from '../../services/keychain.service';
import { BluetoothService } from '../../services/bluetooth.service';

declare const Utils: any;
declare const window: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly wallet: WalletService,
    private readonly keychain: KeyChainService,
    private readonly bt: BluetoothService
  ) {}

  async ngOnInit() {
    await this.bt.disconnect();
    await this.wallet.reset();
    this.keychain.reset();
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

    if (window.plugins) {
      const self = this;
      window.plugins.touchid.isAvailable(async function() {
        window.plugins.touchid.has('spatium', async function() {
          console.log('Touch ID avaialble and Password key available');
          await self.navigate();
          // await self.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['fingerprint', { next: 'waiting' }] } }]);
        }, async function() {
          console.log('Touch ID available but no Password Key available');
          await self.navigate();
          // self.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['fingerprint', { next: 'waiting' }] } }]);
        });
      }, async function() {
        console.log('no Touch ID available');
        await self.navigate();
        // await self.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['pincode', { next: 'waiting' }] } }]);
      });
    }
  }

  async navigate () {
    this.ngZone.run(async () => {
      await this.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['pincode', { next: 'waiting' }] } }]);
    });
  }
}
