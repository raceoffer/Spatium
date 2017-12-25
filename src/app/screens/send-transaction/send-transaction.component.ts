import { Component, OnInit } from '@angular/core';
import WalletData from '../../classes/wallet-data';
import {WalletService} from '../../services/wallet.service';

declare var bcoin: any;
declare var CompoundKey: any;
declare var WatchingWallet: any;

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.scss']
})
export class SendTransactionComponent implements OnInit {
  initiatorWallet: WalletData;

  constructor(private walletService: WalletService) {}

  async ngOnInit() {
    await this.walletService.emulateConnection();
    this.initiatorWallet = await this.walletService.getWallet();
  }
}
