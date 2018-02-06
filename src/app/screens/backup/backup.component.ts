import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DDSAccount, DDSService } from '../../services/dds.service';
import { NotificationService } from '../../services/notification.service';
import {AuthService} from "../../services/auth.service";

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

  public id: string = null;
  public secret: any = null;
  public data: any = null;

  public gasPrice: number = this.dds.toWei('5', 'gwei');

  private account: DDSAccount = null;

  constructor(
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly authService: AuthService
  ) { }

  async ngOnInit() {
    this.id = Utils.sha256(Buffer.from(this.authService.login, 'utf-8')).toString('hex');
    this.secret = this.authService.ethereumSecret;
    this.data = this.authService.encryptedTreeData;

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
    try {
      this.saving = true;
      await this.account.store(this.id, this.data, this.gasPrice);
      await this.updateBalance();
      this.notification.show('Partial secret is uploaded to DDS');

      await this.router.navigate(['/reg-success']);
    } catch (e) {
      this.notification.show('Failed to upload secret');
      console.log(e);
    } finally {
      this.saving = false;
    }
  }

  async skip() {
    await this.router.navigate(['/reg-success']);
  }
}
