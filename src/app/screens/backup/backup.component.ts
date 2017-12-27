import {Component, OnInit} from '@angular/core';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {Router} from '@angular/router';

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

  ethereumAddress = '';
  ethereumBalance = '';
  comission = '0.01';
  syncStateType = SyncState;
  syncState: SyncState = SyncState.Syncing;
  enough = false;
  saveTransactionState = false;

  constructor(private router: Router, private bitcoinKeyFragmentService: BitcoinKeyFragmentService) { }

  async ngOnInit() {
    this.ethereumAddress = await this.bitcoinKeyFragmentService.getEthereumAddress();
    this.updateBalance();
  }

  async updateBalance() {
    try {
      this.syncState = SyncState.Syncing;
      this.ethereumBalance = await this.bitcoinKeyFragmentService.getEthereumBalance();
      this.enough = parseFloat(this.ethereumBalance) >= parseFloat(this.comission);
      this.enough = true;
      this.syncState = SyncState.Ready;
    }
    catch (e) {
      this.syncState = SyncState.Error;
    }
  }

  async saveBitcoinKeyFragmentInEthereumCell() {
    this.saveTransactionState = true;
    await this.bitcoinKeyFragmentService.sendBitcoinKeyFragmentAsEthereumTransaction();
    this.saveTransactionState = false;
    this.updateBalance();
    this.router.navigate(['/waiting'])
  }
}
