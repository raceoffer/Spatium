import { Injectable, NgZone } from '@angular/core';
import { CompoundKey } from 'crypto-core-async';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import { toBehaviourSubject } from '../utils/transformers';
import { ConnectionProviderService } from './connection-provider';
import { CurrencyService } from './currency.service';
import { Coin, KeyChainService, Token } from './keychain.service';
import { BitcoinCashWallet } from './primitives/wallet/bitcoin/bitcoincashwallet';
import { BitcoinWallet } from './primitives/wallet/bitcoin/bitcoinwallet';
import { LitecoinWallet } from './primitives/wallet/bitcoin/litecoinwallet';
import { CurrencyWallet, Status } from './primitives/wallet/currencywallet';
import { ERC20Wallet } from './primitives/wallet/ethereum/erc20wallet';
import { EthereumWallet } from './primitives/wallet/ethereum/ethereumwallet';
import { WorkerService } from './worker.service';

@Injectable()
export class WalletService {
  public coinWallets = new Map<Coin, CurrencyWallet>();
  public tokenWallets = new Map<Token, ERC20Wallet>();
  public currencyWallets = new Map<Coin | Token, CurrencyWallet>();
  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);
  public synchronizing: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === Status.Synchronizing)), false);
  public ready: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === Status.Ready)), false);
  public cancelled: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === Status.Cancelled)), false);
  public failed: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === Status.Failed)), false);
  public statusChanged: Observable<Status> = this.status.pipe(skip(1), distinctUntilChanged());
  public synchronizingEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Synchronizing), mapTo(null));
  public cancelledEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Cancelled), mapTo(null));
  public failedEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Failed), mapTo(null));
  public readyEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Ready), mapTo(null));
  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private readonly connectionProviderService: ConnectionProviderService,
              private readonly currencyService: CurrencyService,
              private readonly keychain: KeyChainService,
              private readonly ngZone: NgZone,
              private readonly workerService: WorkerService) {
    this.coinWallets.set(
      Coin.BTC_test,
      new BitcoinWallet(
        currencyService.getApiServer(Coin.BTC_test),
        'testnet',
        this.keychain,
        1,
        this.connectionProviderService,
        this.ngZone,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.BTC,
      new BitcoinWallet(
        currencyService.getApiServer(Coin.BTC),
        'main',
        this.keychain,
        1,
        this.connectionProviderService,
        this.ngZone,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.BCH,
      new BitcoinCashWallet(
        currencyService.getApiServer(Coin.BCH),
        'main',
        this.keychain,
        1,
        this.connectionProviderService,
        this.ngZone,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.LTC,
      new LitecoinWallet(
        currencyService.getApiServer(Coin.LTC),
        'main',
        this.keychain,
        1,
        this.connectionProviderService,
        this.ngZone,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.ETH,
      new EthereumWallet(
        currencyService.getApiServer(Coin.ETH),
        'main',
        this.keychain,
        1,
        this.connectionProviderService,
        this.ngZone,
        this.workerService.worker
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


    this.connectionProviderService.message.pipe(
      filter(object => object.type === 'verifyTransaction'),
      map(object => object.content),
    ).subscribe(async content => {
      const wallet = this.currencyWallets.get(content.coin);
      return await wallet.startTransactionVerify(await wallet.fromJSON(content.tx));
    });

    this.connectionProviderService.message.pipe(
      filter(object => object.type === 'cancel')
    ).subscribe(async () => {
      // pop the queue
      this.connectionProviderService.message.next({});

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

  public setProgress(value: number): void {
    this.syncProgress.next(Math.min(100, Math.max(0, Math.round(100 * value))));
  }

  public async startSync() {
    if (this.status.getValue() === Status.Synchronizing) {
      throw new Error('Sync in progress');
    }

    try {
      this.setProgress(0);
      this.status.next(Status.Synchronizing);

      const paillierKeys = await CompoundKey.generatePaillierKeys(this.workerService.worker);

      this.setProgress(0.1);

      let coinIndex = 0;
      for (const wallet of Array.from(this.coinWallets.values())) {
        if (this.status.getValue() !== Status.Synchronizing) {
          return;
        }

        const sub = wallet.syncProgress.subscribe(num => {
          this.setProgress(0.1 + 0.8 * (coinIndex + num / 100) / this.coinWallets.size);
        });

        await wallet.sync(paillierKeys);

        sub.unsubscribe();

        coinIndex++;
      }

      if (this.status.getValue() !== Status.Synchronizing) {
        return;
      }

      const ethWallet = this.coinWallets.get(Coin.ETH);

      let tokenIndex = 0;
      for (const wallet of Array.from(this.tokenWallets.values())) {
        if (this.status.getValue() !== Status.Synchronizing) {
          return;
        }

        await wallet.syncDuplicate(ethWallet);

        this.setProgress(0.9 + 0.1 * (tokenIndex + 1) / this.tokenWallets.size);

        tokenIndex++;
      }

      this.setProgress(1);

      if (this.status.getValue() === Status.Synchronizing) {
        this.status.next(Status.Ready);
      }
    } catch (e) {
      console.log(e);
      this.status.next(Status.Failed);
    }
  }

  public async cancelSync() {
    if (this.status.getValue() !== Status.Synchronizing) {
      return;
    }

    try {
      await this.connectionProviderService.send({
        type: 'cancel',
        content: {}
      });
    } catch (ignored) {
    }

    this.status.next(Status.Cancelled);

    for (const wallet of Array.from(this.coinWallets.values())) {
      await wallet.cancelSync();
    }
  }

  createTokenWallet(token: Token, contractAddress: string, decimals: number = 18, network: string = 'main') {
    this.tokenWallets.set(
      token,
      new ERC20Wallet(
        this.currencyService.getApiServer(Coin.ETH),
        network,
        this.keychain,
        1,
        this.connectionProviderService,
        this.ngZone,
        this.workerService.worker,
        token,
        contractAddress,
        decimals,
      ));
  }
}
