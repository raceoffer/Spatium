import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { Coin, KeyChainService } from './keychain.service';
import { combineLatest } from 'rxjs/observable/combineLatest';

import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { CurrencyWallet, Status } from './wallet/currencywallet';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';

declare const bcoin: any;
declare const BitcoinTransaction: any;

@Injectable()
export class WalletService {
  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  private network = 'testnet'; // 'main'; | 'testnet';

  public currencyWallets = new Map<Coin, CurrencyWallet>();

  public status: Observable<Status>;

  public synchronizing: Observable<boolean>;

  public ready: Observable<boolean>;

  public syncProgress: Observable<number>;

  public statusChanged: Observable<Status>;

  public synchronizingEvent: Observable<any>;
  public cancelledEvent: Observable<any>;
  public failedEvent: Observable<any>;
  public readyEvent: Observable<any>;

  constructor(
    private readonly bt: BluetoothService,
    private readonly keychain: KeyChainService
  ) {
    bcoin.set(this.network);

    this.currencyWallets.set(
      Coin.BTC,
      new BitcoinWallet(
        this.network,
        this.keychain,
        1,
        this.messageSubject,
        this.bt
      ));
    this.currencyWallets.set(
      Coin.BCH,
      new BitcoinCashWallet(
        this.network,
        this.keychain,
        1,
        this.messageSubject,
        this.bt
      ));

    this.status = combineLatest(
      Array.from(this.currencyWallets.values()).map(wallet => wallet.status),
      (... values) => {
        return values.reduce((a, b) => Math.min(a, b) as Status, Status.Ready);
      }
    );

    this.synchronizing = combineLatest(
      Array.from(this.currencyWallets.values()).map(wallet => wallet.synchronizing),
      (... values) => {
        return values.reduce((a, b) => a || b, false);
      }
    );

    this.ready = combineLatest(
      Array.from(this.currencyWallets.values()).map(wallet => wallet.ready),
      (... values) => {
        return values.reduce((a, b) => a && b, true);
      }
    );

    this.syncProgress = combineLatest(
      Array.from(this.currencyWallets.values()).map(wallet => wallet.syncProgress),
      (... values) => {
        return values.reduce((a, b) => a + b, 0) / values.length;
      }
    );

    this.statusChanged = this.status.skip(1).distinctUntilChanged();

    this.synchronizingEvent = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
    this.cancelledEvent = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
    this.failedEvent = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
    this.readyEvent = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

    this.bt.message.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.messageSubject
      .filter(object => object.type === 'verifyTransaction')
      .map(object => object.content)
      .subscribe(async content => {
        switch (content.coin) {
          case Coin.BTC:
            return await this.currencyWallets.get(Coin.BTC).startTransactionVerify(
              BitcoinTransaction.fromJSON(content.tx)
            );
          case Coin.BCH:
            return await this.currencyWallets.get(Coin.BCH).startTransactionVerify(
              BitcoinTransaction.fromJSON(content.tx)
            );
        }
      });
  }

  public async reset() {
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public async startSync() {
    for (const wallet of Array.from(this.currencyWallets.values())) {
      const syncEvent = wallet.readyEvent.take(1).takeUntil(combineLatest(this.cancelledEvent, this.failedEvent)).toPromise();

      await wallet.sync();

      await syncEvent;
    }
  }

  public async cancelSync() {
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.cancelSync();
    }
  }
}

