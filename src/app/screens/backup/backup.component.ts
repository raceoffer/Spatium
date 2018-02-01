import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DDSAccount, DDSService } from '../../services/dds.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;

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
  backupCostLabel = 'Estimated commission';
  notEnoughLabel = 'Not enough Ethereum';
  ethBalanceLabel = 'Ethereum balance';

  saveLabel = 'Save';
  skipLabel = 'Skip';

  address = '';
  balance = 0.0;
  comission = 0.0;
  enough = false;

  syncStateType = SyncState;
  syncState: SyncState = SyncState.Ready;

  saving = false;

  addressLoc;

  public id: string = null;
  public secret: any = null;
  public data: any = null;

  public gasPrice: number = this.dds.toWei('5', 'gwei');

  private account: DDSAccount = null;

  constructor(
    private router: Router,
    private dds: DDSService,
    private notification: NotificationService
  ) { }

  async ngOnInit() {
    // should be configured from the outside
    this.id = 'some id';
    this.secret = Utils.randomBytes(32);
    this.data = Utils.randomBytes(352);

    this.account = await this.dds.accountFromSecret(this.secret);
    this.address = this.account.address;
    this.comission = parseFloat(this.dds.fromWei((this.gasPrice * await this.dds.estimateGas(this.id, this.data)).toString(), 'ether'));

    await this.updateBalance();
  }

  async updateBalance() {
    try {
      this.syncState = SyncState.Syncing;
      this.balance = parseFloat(this.dds.fromWei((await this.account.getBalance()).toString(), 'ether'));
      this.enough = this.balance >= this.comission;
      this.syncState = SyncState.Ready;
    } catch (e) {
      this.syncState = SyncState.Error;
    }
  }

  async save() {
    this.saving = true;
    await this.account.store(this.id, this.data, this.gasPrice);
    await this.updateBalance();
    this.saving = false;
    this.notification.show('Partial secret is uploaded to DDS');
    await this.router.navigate(['/wallet']);
  }
}
