import { Injectable } from '@angular/core';
import { CompoundKeyEcdsa } from 'crypto-core-async';
import { sha256 } from 'crypto-core-async/lib/utils';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject, timer } from 'rxjs';
import { filter, map, mapTo, take, takeUntil, first } from 'rxjs/operators';
import { requestDialog } from '../utils/dialog';
import { toBehaviourSubject } from '../utils/transformers';
import { ConnectionProviderService } from './connection-provider';
import { CurrencyService } from './currency.service';
import { Coin, KeyChainService, Token } from './keychain.service';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { LitecoinWallet } from './wallet/bitcoin/litecoinwallet';
import { CurrencyWallet } from './wallet/currencywallet';
import { ERC20Wallet } from './wallet/ethereum/erc20wallet';
import { EthereumWallet } from './wallet/ethereum/ethereumwallet';
import { NemWallet } from './wallet/nem/nemwallet';
import { WorkerService } from './worker.service';

declare const navigator: any;

export enum WalletStatus {
  None = 0,
  Partially,
  Fully
}

export enum SyncStatus {
  None = 0,
  Handshake,
  HandshakeReady,
  Synchronization
}

@Injectable()
export class WalletService {
  public coinWallets = new Map<Coin, CurrencyWallet>();
  public tokenWallets = new Map<Token, ERC20Wallet>();
  public currencyWallets = new Map<Coin | Token, CurrencyWallet>();
  public ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public synchronizedCurrencies: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public status: BehaviorSubject<WalletStatus> = toBehaviourSubject(
    combineLatest([
      this.ready,
      this.synchronizedCurrencies.pipe(
        map(synchronized => {
          if (synchronized === 0) {
            return WalletStatus.None;
          } else if (synchronized === this.currencyWallets.size) {
            return WalletStatus.Fully;
          } else {
            return WalletStatus.Partially;
          }
        })
      )]).pipe(
      map(([ready, status]) => (ready ? status : WalletStatus.None) as WalletStatus)
    ), WalletStatus.None);
  public partiallySync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.Partially)), false);
  public fullySync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.Fully)), false);
  public synchronizatonStatus: BehaviorSubject<SyncStatus> =
    new BehaviorSubject<SyncStatus>(SyncStatus.None);
  public handshaking: BehaviorSubject<boolean> = toBehaviourSubject(
    this.synchronizatonStatus.pipe(map(status => status === SyncStatus.Handshake)), false);
  public synchronizing: BehaviorSubject<boolean> = toBehaviourSubject(
    this.synchronizatonStatus.pipe(map(status => status === SyncStatus.Synchronization)), false);
  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private sessionKeyObserver: Observable<any> = null;
  private resyncSubject: Subject<boolean> = new Subject<boolean>();
  public resyncEvent: Observable<any> = this.resyncSubject.pipe(filter(b => b), mapTo(null));
  private cancelSubject: Subject<boolean> = new Subject<boolean>();
  public cancelEvent: Observable<any> = this.cancelSubject.pipe(filter(b => b), mapTo(null));

  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  private sessionKey = null;
  private compoundSessionKey = null;

  private paillierKeys = null;

  constructor(
    private readonly connectionProviderService: ConnectionProviderService,
    private readonly currencyService: CurrencyService,
    private readonly keychain: KeyChainService,
    private readonly workerService: WorkerService
  ) {
    this.init();
  }

  private async init() {
    this.coinWallets.set(
      Coin.BTC_test,
      new BitcoinWallet(
        await this.currencyService.getApiServer(Coin.BTC_test),
        'testnet',
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.BTC,
      new BitcoinWallet(
        await this.currencyService.getApiServer(Coin.BTC),
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.BCH,
      new BitcoinCashWallet(
        await this.currencyService.getApiServer(Coin.BCH),
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.LTC,
      new LitecoinWallet(
        await this.currencyService.getApiServer(Coin.LTC),
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.ETH,
      new EthereumWallet(
        await this.currencyService.getApiServer(Coin.ETH),
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker
      ));
    this.coinWallets.set(
      Coin.NEM,
      new NemWallet(
        await this.currencyService.getApiServer(Coin.NEM),
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker
      ));

    this.keychain.topTokens.getValue().forEach(async (tokenInfo) => {
      await this.createTokenWallet(tokenInfo.token, tokenInfo.contractAddress, tokenInfo.decimals, tokenInfo.network);
    });

    for (const coin of Array.from(this.coinWallets.keys())) {
      this.currencyWallets.set(coin, this.coinWallets.get(coin));
    }
    for (const token of Array.from(this.tokenWallets.keys())) {
      this.currencyWallets.set(token, this.tokenWallets.get(token));
    }

    this.connectionProviderService.message.subscribe(message => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.sessionKeyObserver = this.messageSubject.pipe(
      filter(object => object.type === 'sessionKey'),
      map(object => object.content),
    );

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
      this.cancelSubject.next(true);
    });

    this.keychain.topTokensChanged.subscribe(() => {
      this.keychain.topTokens.getValue().forEach(async (tokenInfo) => {
        if (!this.tokenWallets.get(tokenInfo.token)) {
          await this.createTokenWallet(tokenInfo.token, tokenInfo.contractAddress, tokenInfo.decimals, tokenInfo.network);
        }
      });
    });

    this.ready.next(true);
  }

  public walletReady() {
    return this.ready.pipe(
      filter(ready => ready),
      first(),
    ).toPromise();
  }

  public async reset() {
    if (this.status.getValue() === WalletStatus.None) {
      return;
    }

    this.sessionKey = null;
    this.compoundSessionKey = null;

    this.synchronizatonStatus.next(SyncStatus.None);
    this.synchronizedCurrencies.next(0);

    this.syncProgress.next(0);
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public setProgress(value: number) {
    this.syncProgress.next(Math.min(100, Math.max(0, Math.round(100 * value))));
  }

  public async startHandshake() {
    try {
      if (this.synchronizatonStatus.getValue() !== SyncStatus.None) {
        return;
      }

      this.synchronizatonStatus.next(SyncStatus.Handshake);

      if (!this.sessionKey) {
        this.sessionKey = await this.newSessionKey();
      }

      console.log('Sending sessionkey', this.sessionKey.toString('hex'));

      await this.connectionProviderService.send(JSON.stringify({
        type: 'sessionKey',
        content: {
          sessionKey: this.sessionKey.toString('hex')
        }
      }));

      const remoteSessionKeyObj = await this.sessionKeyObserver.pipe(
        take(1),
        takeUntil(this.cancelSubject.pipe(filter(b => b)))
      ).toPromise();
      if (!remoteSessionKeyObj) {
        throw new Error('Handshake cancelled');
      }

      // pop the queue
      this.messageSubject.next({});

      const remoteSessionKey = Buffer.from(remoteSessionKeyObj.sessionKey, 'hex');

      console.log('Received remote sessionkey', remoteSessionKey.toString('hex'));

      const compound = await sha256(Buffer.concat([remoteSessionKey, this.sessionKey]));

      console.log('Session fingerprint is', compound.toString('hex'));

      if (this.compoundSessionKey && compound.equals(this.compoundSessionKey)) {
        console.log('Session fingerprint is okay');
        this.synchronizatonStatus.next(SyncStatus.HandshakeReady);
        return;
      }

      console.log('Session fingerprint is new');

      if (this.status.getValue() !== WalletStatus.None) {
        console.log('But wallet is fresh too');
        if (!await requestDialog('You are about to connect with another device. This will undo current synchronization progress. Are you sure?')) {
          console.log('Rejected to change session');
          this.synchronizatonStatus.next(SyncStatus.None);
          await this.connectionProviderService.disconnect();
          return;
        } else {
          await this.reset();
        }
      }

      this.sessionKey = await this.newSessionKey();

      console.log('Agreed to change session, sending key', this.sessionKey.toString('hex'));

      await this.connectionProviderService.send(JSON.stringify({
        type: 'sessionKey',
        content: {
          sessionKey: this.sessionKey.toString('hex')
        }
      }));

      const newRemoteSessionKeyObj = await this.sessionKeyObserver.pipe(
        take(1),
        takeUntil(this.cancelSubject.pipe(filter(b => b)))
      ).toPromise();
      if (!newRemoteSessionKeyObj) {
        throw new Error('Handshake cancelled');
      }

      // pop the queue
      this.messageSubject.next({});

      const newRemoteSessionKey = Buffer.from(newRemoteSessionKeyObj.sessionKey, 'hex');

      console.log('Received new remote sessionkey', newRemoteSessionKey.toString('hex'));

      this.compoundSessionKey = await sha256(Buffer.concat([newRemoteSessionKey, this.sessionKey]));

      console.log('New session fingerprint is', this.compoundSessionKey.toString('hex'));

      this.synchronizatonStatus.next(SyncStatus.HandshakeReady);
    } catch (e) {
      this.synchronizatonStatus.next(SyncStatus.None);
      throw e;
    }
  }

  public async startSync() {
    if (this.synchronizatonStatus.getValue() !== SyncStatus.HandshakeReady) {
      throw new Error('Trying to synchronize without handshake ready');
    }

    try {
      this.setProgress(0);

      this.synchronizatonStatus.next(SyncStatus.Synchronization);

      if (!this.paillierKeys) {
        this.paillierKeys = await CompoundKeyEcdsa.generatePaillierKeys(this.workerService.worker);
      }

      this.setProgress(0.1);

      let coinIndex = 0;
      for (const wallet of Array.from(this.coinWallets.values())) {
        if (!this.synchronizing.getValue()) {
          return;
        }

        if (!wallet.ready.getValue()) {
          await wallet.reset();
          const sub = wallet.syncProgress.subscribe(num => {
            this.setProgress(0.1 + 0.8 * (coinIndex + num / 100) / this.coinWallets.size);
          });
          await wallet.sync({paillierKeys: this.paillierKeys});
          sub.unsubscribe();
        } else {
          this.setProgress(0.1 + 0.8 * (coinIndex + 1) / this.coinWallets.size);
        }

        await timer(100).toPromise();

        this.synchronizedCurrencies.next(coinIndex + 1);

        coinIndex++;
      }

      if (!this.synchronizing.getValue()) {
        return;
      }

      const ethWallet = this.coinWallets.get(Coin.ETH);

      let tokenIndex = 0;
      for (const wallet of Array.from(this.tokenWallets.values())) {
        if (!this.synchronizing.getValue()) {
          return;
        }

        if (!wallet.ready.getValue()) {
          await wallet.reset();
          await wallet.syncDuplicate(ethWallet);
        }

        this.setProgress(0.9 + 0.1 * (tokenIndex + 1) / this.tokenWallets.size);
        this.synchronizedCurrencies.next(this.coinWallets.size + tokenIndex + 1);

        tokenIndex++;
      }

      this.synchronizatonStatus.next(SyncStatus.None);
      this.setProgress(1);
    } catch (e) {
      console.log(e);
    }
  }

  public async cancelSync() {
    this.cancelSubject.next(true);

    for (const wallet of Array.from(this.coinWallets.values())) {
      if (!wallet.ready.getValue()) {
        await wallet.reset();
      }
    }
    for (const wallet of Array.from(this.tokenWallets.values())) {
      if (!wallet.ready.getValue()) {
        await wallet.reset();
      }
    }

    this.synchronizatonStatus.next(SyncStatus.None);
  }

  public async createTokenWallet(token: Token, contractAddress: string, decimals: number = 18, network: string = 'main') {
    this.tokenWallets.set(
      token,
      new ERC20Wallet(
        await this.currencyService.getApiServer(Coin.ETH),
        network,
        this.keychain,
        1,
        this.messageSubject,
        this.connectionProviderService,
        this.workerService.worker,
        token,
        contractAddress,
        decimals,
      ));
  }

  private async newSessionKey() {
    const timestamp = new Date().toString();
    const seed = this.keychain.getSeed();
    return await sha256(Buffer.concat([Buffer.from(timestamp), await sha256(seed)]));
  }
}
