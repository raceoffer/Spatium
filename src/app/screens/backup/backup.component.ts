import {Component, OnInit} from '@angular/core';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {Router} from '@angular/router';
import {WalletService} from '../../services/wallet.service';

declare const window: any;

enum SyncState {
  Ready,
  Syncing,
  Error,
}

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css']
})
export class BackupComponent implements OnInit {
  backupLabel = 'Saving to Decentralized Storage';
  ethAddressLabel = 'Ethereum address';
  backupCostLabel = 'Cost';
  notEnoughLabel = 'Not enough Ethereum';
  ethBalanceLabel = 'Ethereum balance';
  SaveLabel = 'Save';
  CancelLabel = 'Cancel';
  SkipLabel = 'Skip';

  ethereumAddress = '';
  ethereumBalance = '';
  comission = '0.01';
  syncStateType = SyncState;
  syncState: SyncState = SyncState.Syncing;
  enough = false;
  saveTransactionState = false;

  constructor(private router: Router,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService,
              private walletService: WalletService) { }

  async ngOnInit() {
    await this.bitcoinKeyFragmentService.ensureReady();

    this.ethereumAddress = await this.bitcoinKeyFragmentService.getEthereumAddress();
    await this.updateBalance();
  }

  async updateBalance() {
    try {
      this.syncState = SyncState.Syncing;
      this.ethereumBalance = await this.bitcoinKeyFragmentService.getEthereumBalance();
      this.enough = parseFloat(this.ethereumBalance) >= parseFloat(this.comission);
      this.syncState = SyncState.Ready;
    } catch (e) {
      this.syncState = SyncState.Error;
    }
  }

  async saveBitcoinKeyFragmentInEthereumCell() {
    this.saveTransactionState = true;
    await this.bitcoinKeyFragmentService.sendBitcoinKeyFragment(this.walletService.keyFragment);
    this.saveTransactionState = false;
    await this.updateBalance();
    window.plugins.toast.showLongBottom(
      'Partial secret is uploaded to DDS',
      3000, 'Partial secret is uploaded to DDS',
      console.log('Partial secret is uploaded to DDS')
    );
    await this.router.navigate(['/wallet']);
  }
}
