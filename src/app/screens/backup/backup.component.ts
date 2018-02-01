import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { DDSAccount, DDSService } from '../../services/dds.service';
import {NotificationService} from "../../services/notification.service";

declare const Utils: any;
declare const KeyChain: any;

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
  addressLoc;

  public id: string = null;
  public secret: any = null;
  public data: any = null;

  private account: DDSAccount = null;

  constructor(
    private router: Router,
    private dds: DDSService,
    private notification: NotificationService
  ) { }

  async ngOnInit() {
    this.account = await this.dds.accountFromSecret(this.secret);

    await this.updateBalance();
  }

  async updateBalance() {
    try {
      this.syncState = SyncState.Syncing;
      this.ethereumBalance = this.dds.fromWei(await this.account.getBalance(), 'ether');
      this.enough = parseFloat(this.ethereumBalance) >= parseFloat(this.comission);
      this.syncState = SyncState.Ready;
    } catch (e) {
      this.syncState = SyncState.Error;
    }
  }

  async save() {
    this.saveTransactionState = true;
    await this.account.store(this.id, this.data, this.dds.toWei('5', 'gwei'));
    this.saveTransactionState = false;
    await this.updateBalance();
    this.notification.show('Partial secret is uploaded to DDS');
    await this.router.navigate(['/wallet']);
  }
}
