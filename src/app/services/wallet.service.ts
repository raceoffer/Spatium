import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { Coin, Token, KeyChainService } from './keychain.service';
import { toBehaviourSubject } from '../utils/transformers';

import { CurrencyWallet, Status } from './wallet/currencywallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { LitecoinWallet } from './wallet/bitcoin/litecoinwallet';
import { EthereumWallet } from './wallet/ethereum/ethereumwallet';
import { ERC20Wallet } from './wallet/ethereum/erc20wallet';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const CryptoCore: any;

@Injectable()
export class WalletService {
  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  public coinWallets = new Map<Coin, CurrencyWallet>();
  public tokenWallets = new Map<Token, ERC20Wallet>();

  public currencyWallets = new Map<Coin | Token, CurrencyWallet>();

  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);

  public synchronizing: BehaviorSubject<boolean> = toBehaviourSubject(this.status.map(status => status === Status.Synchronizing), false);
  public ready: BehaviorSubject<boolean> = toBehaviourSubject(this.status.map(status => status === Status.Ready), false);
  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  public statusChanged: Observable<Status> = this.status.skip(1).distinctUntilChanged();

  public synchronizingEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
  public cancelledEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
  public failedEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
  public readyEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

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
      Coin.LTC,
      new LitecoinWallet(
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
      this.createTokenWallet(tokenInfo.token, tokenInfo.contractAddress, tokenInfo.network);
    });

    for (const coin of Array.from(this.coinWallets.keys())) {
      this.currencyWallets.set(coin, this.coinWallets.get(coin));
    }
    for (const token of Array.from(this.tokenWallets.keys())) {
      this.currencyWallets.set(token, this.tokenWallets.get(token));
    }

    this.bt.message.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.messageSubject
      .filter(object => object.type === 'verifyTransaction')
      .map(object => object.content)
      .subscribe(async content => {
        const wallet = this.currencyWallets.get(content.coin);
        return await wallet.startTransactionVerify(await wallet.fromJSON(content.tx));
      });

    this.messageSubject
      .filter(object => object.type === 'cancel')
      .subscribe(async () => {
        // pop the queue
        this.messageSubject.next({});

        this.status.next(Status.Cancelled);

        for (const wallet of Array.from(this.coinWallets.values())) {
          await wallet.cancelSync();
        }
      });
  }

  public async reset() {
    if (this.status.getValue() === Status.None) {
      return;
    }

    this.status.next(Status.None);
    this.syncProgress.next(0);
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public async startSync() {
    if (this.status.getValue() === Status.Synchronizing) {
      throw new Error('Sync in progress');
    }

    try {
      this.status.next(Status.Synchronizing);

      const paillierKeys = await CryptoCore.CompoundKey.generatePaillierKeys();

      this.syncProgress.next(
        Math.min(100, Math.max(0,
          this.syncProgress.getValue() + 2 * 100 / (2 + 10 * this.coinWallets.size + this.tokenWallets.size))
        ));

      for (const wallet of Array.from(this.coinWallets.values())) {
        if (this.status.getValue() !== Status.Synchronizing) {
          return;
        }

        await wallet.sync(paillierKeys);

        this.syncProgress.next(
          Math.min(100, Math.max(0,
            this.syncProgress.getValue() + 10 * 100 / (2 + 10 * this.coinWallets.size + this.tokenWallets.size))
          ));
      }

      if (this.status.getValue() !== Status.Synchronizing) {
        return;
      }

      const ethWallet = this.coinWallets.get(Coin.ETH);

      for (const wallet of Array.from(this.tokenWallets.values())) {
        if (this.status.getValue() !== Status.Synchronizing) {
          return;
        }

        await wallet.syncDuplicate(ethWallet);

        this.syncProgress.next(
          Math.min(100, Math.max(0,
            this.syncProgress.getValue() + 100 / (2 + 10 * this.coinWallets.size + this.tokenWallets.size))
          ));
      }

      if (this.status.getValue() === Status.Synchronizing) {
        this.status.next(Status.Ready);
      }
    } catch (e) {
      this.status.next(Status.Failed);
    }
  }

  public async cancelSync() {
    if (this.status.getValue() !== Status.Synchronizing) {
      return;
    }

    try {
      await this.bt.send(JSON.stringify({
        type: 'cancel',
        content: {}
      }));
    } catch (ignored) {}

    this.status.next(Status.Cancelled);

    for (const wallet of Array.from(this.coinWallets.values())) {
      await wallet.cancelSync();
    }
  }

  createTokenWallet (token: Token, contractAddress: string, network: string = 'main') {
    this.tokenWallets.set(
      token,
      new ERC20Wallet(
        network,
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

