import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { Coin, Token, KeyChainService, TokenEntry } from './keychain.service';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { toBehaviourSubject } from '../utils/transformers';

import { CurrencyWallet, Status } from './wallet/currencywallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { EthereumWallet } from './wallet/ethereum/ethereumwallet';
import { ERC20CurrencyWallet } from './wallet/ethereum/erc20wallet';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const CryptoCore: any;

@Injectable()
export class WalletService {
  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  public coinWallets = new Map<Coin, CurrencyWallet>();
  public tokenWallets = new Map<Token, ERC20CurrencyWallet>();

  public currencyWallets = new Map<Coin | Token, CurrencyWallet>();

  public status: Observable<Status>;

  public synchronizing: Observable<boolean>;

  public ready: Observable<boolean>;

  public syncProgress: Observable<number>;

  public statusChanged: Observable<Status>;

  public synchronizingEvent: Observable<any>;
  public cancelledEvent: Observable<any>;
  public failedEvent: Observable<any>;
  public readyEvent: Observable<any>;

  public paillierKeys: any = null;

  public generatedKeys: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);

  constructor(
    private readonly bt: BluetoothService,
    private readonly keychain: KeyChainService,
    private readonly ngZone: NgZone
  ) {
    this.coinWallets.set(
      Coin.BTC_test,
      new BitcoinWallet(
        'testnet',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.coinWallets.set(
      Coin.BTC,
      new BitcoinWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.coinWallets.set(
      Coin.BCH,
      new BitcoinCashWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.coinWallets.set(
      Coin.ETH,
      new EthereumWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));

    keychain.topTokens.forEach((tokenInfo) => {
      this.createTokenWallet(tokenInfo.token, tokenInfo.contractAddress);
    })

    for (const coin of Array.from(this.coinWallets.keys())) {
      this.currencyWallets.set(coin, this.coinWallets.get(coin));
    }
    for (const token of Array.from(this.tokenWallets.keys())) {
      this.currencyWallets.set(token, this.tokenWallets.get(token));
    }

    this.status = toBehaviourSubject(combineLatest(
      Array.from(this.coinWallets.values())
        .concat(Array.from(this.tokenWallets.values()))
        .map(wallet => wallet.status)
        .concat(this.generatedKeys),
      (... values) => {
        if (values.every(value => value === Status.Ready)) {
          return Status.Ready;
        }
        if (values.some(value => value === Status.Failed)) {
          return Status.Failed;
        }
        if (values.some(value => value === Status.Cancelled)) {
          return Status.Cancelled;
        }
        if (values.every(value => value === Status.None)) {
          return Status.None;
        }
        return Status.Synchronizing;
      }
    ), Status.None);

    this.synchronizing = toBehaviourSubject(this.status.map(status => status === Status.Synchronizing), false);
    this.ready = toBehaviourSubject(this.status.map(status => status === Status.Ready), false);

    // That's a progress magic:
    // progress = (keygen_progress + sum(coin_progress, n) + sum(0.1*token_progress, m)) / (1 + n + 0.1*m)
    this.syncProgress = toBehaviourSubject(combineLatest(
      toBehaviourSubject(combineLatest(
        Array.from(this.coinWallets.values()).map(wallet => wallet.syncProgress),
        (... values) => {
          return values.reduce((a, b) => a + b, 0);
        }
      ), 0),
      toBehaviourSubject(combineLatest(
        Array.from(this.tokenWallets.values()).map(wallet => wallet.ready),
        (... values) => {
          return values.map(ready => (ready ? 100 : 0) / 10).reduce((a, b) => a + b, 0);
        }
      ), 0),
      toBehaviourSubject(this.generatedKeys.map(keys => keys === Status.Ready ? 100 : 20), 0),
      (a, b, c) => {
        return (a + b + c) / (this.coinWallets.size + this.tokenWallets.size / 10 + 1);
      }), 0);

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
        const wallet = this.currencyWallets.get(content.coin);
        return await wallet.startTransactionVerify(wallet.fromJSON(content.tx));
      });
  }

  public async reset() {
    this.generatedKeys.next(Status.None);
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public async startSync() {
    this.generatedKeys.next(Status.Synchronizing);

    this.paillierKeys = await CryptoCore.CompoundKey.generatePaillierKeys();

    this.generatedKeys.next(Status.Ready);

    for (const wallet of Array.from(this.coinWallets.values())) {
      const syncEvent = wallet.readyEvent.take(1).takeUntil(combineLatest(this.cancelledEvent, this.failedEvent)).toPromise();

      await wallet.sync(this.paillierKeys);

      await syncEvent;
    }

    const ethWallet = this.coinWallets.get(Coin.ETH);

    for (const wallet of Array.from(this.tokenWallets.values())) {
      await wallet.syncDuplicate(ethWallet);
    }
  }

  public async cancelSync() {
    for (const wallet of Array.from(this.coinWallets.values())) {
      await wallet.cancelSync();
    }
  }

  createTokenWallet (token: Token, contractAddress: string) {
    this.tokenWallets.set(
      token,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        token,
        contractAddress
      ));
}

}

