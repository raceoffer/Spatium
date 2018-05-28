import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject,  Observable,  ReplaySubject, timer } from 'rxjs';
import { filter, skip, map, mapTo, distinctUntilChanged } from 'rxjs/operators';
import { toBehaviourSubject } from '../utils/transformers';

import { BluetoothService } from './bluetooth.service';
import { CurrencyService } from './currency.service';
import { WorkerService } from './worker.service';
import { Coin, KeyChainService, Token } from './keychain.service';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { LitecoinWallet } from './wallet/bitcoin/litecoinwallet';

import { CurrencyWallet, Status } from './wallet/currencywallet';
import { ERC20Wallet } from './wallet/ethereum/erc20wallet';
import { EthereumWallet } from './wallet/ethereum/ethereumwallet';

import {
  CompoundKey,
  BitcoinTransaction,
  BitcoinCashTransaction,
  LitecoinTransaction,
  EthereumTransaction
} from 'crypto-core-async';

export enum WalletStatus {
  None = 0,
  Partially,
  Fully
}

@Injectable()
export class WalletService {
  public coinWallets = new Map<Coin, CurrencyWallet>();
  public tokenWallets = new Map<Token, ERC20Wallet>();
  public currencyWallets = new Map<Coin | Token, CurrencyWallet>();
  public synchronizing: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public status: BehaviorSubject<WalletStatus> = new BehaviorSubject<WalletStatus>(WalletStatus.None);
  public partiallySync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.Partially)), false);
  public fullySync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.Fully)), false);

  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  private coinIndex = 0;
  private tokenIndex = 0;

  constructor(
    private readonly bt: BluetoothService,
    private readonly currencyService: CurrencyService,
    private readonly keychain: KeyChainService,
    private readonly ngZone: NgZone,
    private readonly workerService: WorkerService
  ) {
    CompoundKey.useWorker(workerService.worker);
    BitcoinTransaction.useWorker(workerService.worker);
    BitcoinCashTransaction.useWorker(workerService.worker);
    LitecoinTransaction.useWorker(workerService.worker);
    EthereumTransaction.useWorker(workerService.worker);

    this.coinWallets.set(
      Coin.BTC_test,
      new BitcoinWallet(
        currencyService.getApiServer(Coin.BTC_test),
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
        currencyService.getApiServer(Coin.BTC),
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
        currencyService.getApiServer(Coin.BCH),
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
        currencyService.getApiServer(Coin.LTC),
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
        currencyService.getApiServer(Coin.ETH),
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));

    keychain.topTokens.forEach((tokenInfo) => {
      this.createTokenWallet(tokenInfo.token, tokenInfo.contractAddress, tokenInfo.decimals, tokenInfo.network);
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

    this.messageSubject.pipe(
      filter(object => object.type === 'verifyTransaction'),
      map(object => object.content),
    ).subscribe(async content => {
        const wallet = this.currencyWallets.get(content.coin);
        return await wallet.startTransactionVerify(await wallet.fromJSON(content.tx));
      });

    this.messageSubject.pipe(
      filter(object => object.type === 'cancel')
    ).subscribe(async () => {
        // pop the queue
        this.messageSubject.next({});

        this.changeStatus();

        for (const wallet of Array.from(this.coinWallets.values())) {
          await wallet.cancelSync();
        }
      });
  }

  // при пересинхронизации с другим устройством/выходе
  public async reset() {
    if (this.status.getValue() === WalletStatus.None) {
      return;
    }

    this.coinIndex = 0;
    this.tokenIndex = 0;
    this.changeStatus();
    this.syncProgress.next(0);
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public setProgress(value: number): void {
    this.syncProgress.next(Math.min(100, Math.max(0, Math.round(100 * value))));
  }

  public async startSync() {
    console.log(this.synchronizing.value);
    if (this.synchronizing.value) {
      throw new Error('Sync in progress');
    }

    try {
      // если ключ не совпадет (другое устройство для сопряжения)
      this.reset();

      this.setProgress(0);
      this.synchronizing.next(true);

      const paillierKeys = await CompoundKey.generatePaillierKeys();

      this.setProgress(0.1);

      this.coinIndex = 0;
      for (const wallet of Array.from(this.coinWallets.values())) {
        if (!this.synchronizing.value) {
          return;
        }

        const sub = wallet.syncProgress.subscribe(num => {
          this.setProgress(0.1 + 0.8 * (this.coinIndex + num / 100) / this.coinWallets.size);
        });
        this.changeStatus();

        await wallet.sync(paillierKeys);

        sub.unsubscribe();

        this.coinIndex++;
      }

      if (!this.synchronizing.value) {
        return;
      }

      const ethWallet = this.coinWallets.get(Coin.ETH);

      this.tokenIndex = 0;
      for (const wallet of Array.from(this.tokenWallets.values())) {
        if (!this.synchronizing.value) {
          return;
        }

        await wallet.syncDuplicate(ethWallet);

        this.setProgress(0.9 + 0.1 * (this.tokenIndex + 1) / this.tokenWallets.size);
        this.changeStatus();
        await timer(100).toPromise();

        this.tokenIndex++;
      }

      this.setProgress(1);

      if (this.synchronizing.value) {
        this.synchronizing.next(false);
        this.changeStatus();
        this.bt.disconnect();
      }

    } catch (e) {
      console.log(e);
      this.synchronizing.next(false);
      this.changeStatus();
      this.bt.disconnect();
    }
  }

  public changeStatus() {
    if (this.coinIndex === this.coinWallets.size && this.tokenIndex === this.tokenWallets.size) {
      this.status.next(WalletStatus.Fully);
    } else {
      if (this.coinIndex !== 0 || this.tokenIndex !== 0) {
        this.status.next(WalletStatus.Partially);
      } else {
        this.status.next(WalletStatus.None);
      }
    }
  }

  public async cancelSync() {
    if (!this.synchronizing.value) {
      return;
    }

    try {
      await this.bt.send(JSON.stringify({
        type: 'cancel',
        content: {}
      }));
    } catch (ignored) {
    }

    for (const wallet of Array.from(this.coinWallets.values())) {
      await wallet.cancelSync();
    }

    this.synchronizing.next(false);
    this.changeStatus();
  }

  createTokenWallet(token: Token, contractAddress: string, decimals: number = 18, network: string = 'main') {
    this.tokenWallets.set(
      token,
      new ERC20Wallet(
        this.currencyService.getApiServer(Coin.ETH),
        network,
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        token,
        contractAddress,
        decimals,
      ));
  }
}
