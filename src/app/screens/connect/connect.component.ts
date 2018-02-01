import { Component } from '@angular/core';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent {
  stConnect = 'Synchronizing an account';
  cancelLabel = 'Cancel';

  progress = this.wallet.syncProgress;

  constructor(private wallet: WalletService) {}

  async cancelSync() {
    await this.wallet.cancelSync();
  }
}
