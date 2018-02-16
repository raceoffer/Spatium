import { Component, OnDestroy, OnInit } from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import { DDSAccount, DDSService } from '../../services/dds.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

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
export class BackupComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  private account: DDSAccount = null;

  public backupLabel = 'Saving to Decentralized Storage';
  public ethAddressLabel = 'Ethereum address';
  public backupCostLabel = 'Estimated fee, ETH';
  public notEnoughLabel = 'Not enough Ethereum';
  public ethBalanceLabel = 'Balance, ETH';

  public saveLabel = 'Save';

  public address = '';
  public balance = 0.0;
  public comission = 0.0;
  public enough = false;

  public syncStateType = SyncState;
  public syncState: SyncState = SyncState.Ready;

  public saving = false;

  public id: string = null;
  public secret: any = null;
  public data: any = null;

  public gasPrice: number = this.dds.toWei('5', 'gwei');

  private back: string = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly authService: AuthService
  ) {
    this.route.params.subscribe((params: Params) => {
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

  async ngOnInit() {
    this.id = Utils.sha256(Buffer.from(this.authService.login, 'utf-8')).toString('hex');
    this.secret = this.authService.ethereumSecret;
    this.data = this.authService.encryptedTreeData;

    this.account = await this.dds.accountFromSecret(this.secret);
    this.address = this.account.address;
    this.comission = parseFloat(this.dds.fromWei((this.gasPrice * await this.account.estimateGas(this.id, this.data)).toString(), 'ether'));

    await this.updateBalance();
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBack() {
    switch (this.back) {
      case 'factor-node':
        if (!this.saving) {
          await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        } else {
          await this.router.navigate(['/navigator', { outlets: { navigator: ['wallet'] } }]);
        }
        break;
      case 'registration':
        if (!this.saving) {
          await this.router.navigate(['/registration']);
        } else {
          await this.router.navigate(['/start']);
        }
        break;
    }
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

  save() {
    this.saving = true;
    this.subscriptions.push(
      Observable.fromPromise(this.account.store(this.id, this.data, this.gasPrice))
        .mapTo(true)
        .catch(ignored => { console.log(ignored); return Observable.of(false); })
        .subscribe(async (success) => {
          this.saving = false;
          if (success) {
            switch (this.back) {
              case 'factor-node':
                this.notification.show('Successfully uploaded the secret');
                await this.router.navigate(['/navigator', { outlets: { navigator: ['wallet'] } }]);
                break;
              case 'registration':
                await this.router.navigate(['/reg-success']);
                break;
            }
          } else {
            this.notification.show('Failed to upload the secret');
          }
        }));
  }
}
