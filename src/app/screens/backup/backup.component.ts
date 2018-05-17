import { Component, OnDestroy, OnInit } from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import { DDSAccount, DDSService } from '../../services/dds.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';

import { Observable } from 'rxjs';




declare const Utils: any;
declare const cordova: any;

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

  private backupWallet = null;

  public backupLabel = 'Saving to decentralized storage';
  public backupText = 'Please top up this address in order to save your secret into decentralized storage.';
  public ethAddressLabel = 'Ethereum address';
  public backupCostLabel = 'Estimated fee, ETH';
  public notEnoughLabel = 'Not enough Ethereum';
  public ethBalanceLabel = 'Balance, ETH';

  public saveLabel = 'Save';

  public address = '';
  public balance = 0.0;
  public comission = null;
  public enough = false;

  public syncStateType = SyncState;
  public syncState: SyncState = SyncState.Ready;

  public saving = false;

  public id: string = null;
  public data: any = null;

  public gasPrice: number = this.dds.toWei('5', 'gwei');

  private back: string = null;
  private next: string = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService
  ) {
    this.route.params.subscribe((params: Params) => {
      if (params['back']) {
        this.back = params['back'];
      }

      if (params['next']) {
        this.next = params['next'];
      }
    });
  }

  async ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.id = await AuthService.toId(this.authService.login);
    this.account = await this.dds.getStoreAccount(this.id);
    this.data = this.authService.currentTree;
    this.address = this.account.address;
    this.comission = parseFloat(this.dds.fromWei((this.gasPrice * await this.account.estimateGas(this.id, this.data)).toString(), 'ether'));
    await this.updateBalance();
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
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

  getQrCodeText() {
      return `etherium:${this.address}?value=${this.comission}`;
  }

  copy() {
    cordova.plugins.clipboard.copy(this.address);
  }

  async save() {
    this.saving = true;
    Observable.fromPromise(this.account.store(this.id, this.data, this.gasPrice))
    .mapTo(true)
    .catch(ignored => { console.log(ignored); return Observable.of(false); })
    .subscribe(async (success) => {
        if (!success) {
          this.saving = false;
          this.notification.show('Failed to upload the secret');
          return;
        }

        this.notification.show('Successfully uploaded the secret');

        switch (this.next) {
            case "reg-success":
                await this.router.navigate(['/reg-success']);
                break;
            case 'wallet':
                await this.router.navigate(['/navigator', { outlets: { navigator: ['wallet'] } }]);
                break;
            default:
                await this.router.navigate(['/reg-success']);
                break;
        }
    });
  }
}
