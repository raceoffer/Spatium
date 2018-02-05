import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { KeyChainService } from '../../services/keychain.service';
import { BluetoothService } from '../../services/bluetooth.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly notification: NotificationService,
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
      this.notification.show('No stored seed found');
    }

    await this.router.navigate(['/factor', { back: 'start' }, {outlets: {'factor': ['pincode', {next: 'waiting'}]}}]);
  }
}
