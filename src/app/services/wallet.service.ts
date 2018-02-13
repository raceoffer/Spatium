import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { KeyChainService } from './keychain.service';
import { combineLatest } from 'rxjs/observable/combineLatest';

import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { Status } from './wallet/currencywallet';

declare const bcoin: any;
declare const BitcoinTransaction: any;

@Injectable()
export class WalletService {
  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  private network = 'testnet'; // 'main'; | 'testnet';

  public currencyWallet: BitcoinWallet =
    new BitcoinWallet(
      this.network,
      this.keychain,
      1,
      this.messageSubject,
      this.bt
    );

  public syncProgress: Observable<number> = combineLatest(
    [this.currencyWallet.syncProgress],
    (... values) => {
      return values.reduce((a, b) => a + b, 0);
    }
  );

  public status: Observable<Status> = combineLatest(
    [this.currencyWallet.status],
    (... values) => {
      return values.reduce((a, b) => Math.min(a, b) as Status, Status.Ready);
    }
  );

  public synchronizing: Observable<boolean> = combineLatest(
    [this.currencyWallet.synchronizing],
    (... values) => {
      return values.reduce((a, b) => a || b, false);
    }
  );

  public ready: Observable<boolean> = combineLatest(
    [this.currencyWallet.ready],
    (... values) => {
      return values.reduce((a, b) => a && b, true);
    }
  );

  public statusChanged: Observable<Status> = this.status.skip(1).distinctUntilChanged();

  public synchronizingEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
  public cancelledEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
  public failedEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
  public readyEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

  constructor(
    private readonly bt: BluetoothService,
    private readonly keychain: KeyChainService
  ) {
    bcoin.set(this.network);

    this.bt.message.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.messageSubject
      .filter(object => object.type === 'verifyTransaction')
      .map(object => object.content)
      .subscribe(async content => {
        return await this.currencyWallet.startTransactionVerify(
          BitcoinTransaction.fromJSON(content)
        );
      });
  }

  public async reset() {
    await this.currencyWallet.reset();
  }

  public async startSync() {
    await this.currencyWallet.sync();
  }

  public async cancelSync() {
    await this.currencyWallet.cancelSync();
  }
}

