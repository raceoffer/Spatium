import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import { toBehaviourSubject } from '../utils/transformers';
import { BluetoothService, Device } from './bluetooth.service';
import { CurrencyService } from './currency.service';
import { Coin, KeyChainService, Token } from './keychain.service';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { LitecoinWallet } from './wallet/bitcoin/litecoinwallet';
import { CurrencyWallet } from './wallet/currencywallet';
import { ERC20Wallet } from './wallet/ethereum/erc20wallet';
import { EthereumWallet } from './wallet/ethereum/ethereumwallet';
import { WorkerService } from './worker.service';

import { CompoundKeyEcdsa } from 'crypto-core-async';

declare const navigator: any;

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
  public noneSync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.None)), false);
  public partiallySync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.Partially)), false);
  public fullySync: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(map(status => status === WalletStatus.Fully)), false);
  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private mustResync: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public mustResyncChanged: Observable<boolean> = this.mustResync.pipe(skip(1), distinctUntilChanged());
  public resyncEvent: Observable<any> = this.mustResyncChanged.pipe(filter(enabled => enabled), mapTo(null));
  public cancelResyncEvent: Observable<any> = this.mustResyncChanged.pipe(filter(enabled => !enabled), mapTo(null));

  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);
  private sessionKey = Buffer.from('');
  private sessionPartnerKey = Buffer.from('');
  private partnerDevice: BehaviorSubject<Device> = new BehaviorSubject<Device>(null);
  private currencyWallet: CurrencyWallet = null;
  private tx: any = null;
  private isTransactionReconnect = false;
  private isPartnerFully = false;

  private coinIndex = 0;
  private tokenIndex = 0;

  constructor(
    private readonly bt: BluetoothService,
    private readonly currencyService: CurrencyService,
    private readonly keychain: KeyChainService,
    private readonly workerService: WorkerService
  ) {
    this.coinWallets.set(
      Coin.BTC_test,
      new BitcoinWallet(
        currencyService.getApiServer(Coin.BTC_test),
        'testnet',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.workerService.worker
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
        this.workerService.worker
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
        this.workerService.worker
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
        this.workerService.worker
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

    this.bt.message.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.messageSubject.pipe(
      filter(object => object.type === 'sessionKeyVerifyer'),
      map(object => object.content),
    ).subscribe(async content => {
      console.log(this.sessionPartnerKey);
      const data = Buffer.from(content.data);
      console.log(data);
      console.log(!this.sessionPartnerKey.equals(data));
      const isOlder = this.sessionPartnerKey.equals(data);

      if (this.isTransactionReconnect) {
        this.isTransactionReconnect = false;
        if (!isOlder) {
          console.log('poherili kluch');
          this.openPairedDeviceChangeDialog();
        } else {
          console.log('vso normalno');
          await this.currencyWallet.requestTransactionVerify(this.tx);
        }
      } else { // sync
        if (!isOlder && this.status.value !== WalletStatus.None) {
          console.log('sessionKeyVerifyer other key');
          await this.openUpdateKeyDialog();
        } else {
          console.log('sessionKeyVerifyer ok key or none status');
          this.sessionPartnerKey = data;
          if (!isOlder) {
            await this.reset();
          }
          this.startSync();

          await this.bt.send(JSON.stringify({
            type: 'startSync',
            content: isOlder
          }));
        }
      }
    });

    this.messageSubject.pipe(
      filter(object => object.type === 'sessionKeyVerifyerUpd'),
      map(object => object.content),
    ).subscribe(async content => {
      console.log('sessionKeyVerifyerUpd');
      const data = Buffer.from(content.data);
      this.sessionPartnerKey = data;
      await this.reset();
      this.startSync();

      await this.bt.send(JSON.stringify({
        type: 'startSync',
        content: false
      }));
    });

    this.messageSubject.pipe(
      filter(object => object.type === 'sessionKey'),
      map(object => object.content),
    ).subscribe(async content => {
      console.log(this.sessionPartnerKey);
      const data = Buffer.from(content.data);
      console.log(data);
      console.log(!this.sessionPartnerKey.equals(data));
      if (!this.sessionPartnerKey.equals(data)) {
        console.log('sessionKey other key');
      } else {
        console.log('sessionKey ok key');
      }
      this.sessionPartnerKey = data;
    });

    this.messageSubject.pipe(
      filter(object => object.type === 'sessionKeyUpd'),
      map(object => object.content),
    ).subscribe(async content => {
      console.log('sessionKeyUpd');
      const data = Buffer.from(content.data);
      this.sessionPartnerKey = data;
      console.log('generate sessionKey verif');
      this.sessionKey = Buffer.from(new Date().toString());

      await this.bt.send(JSON.stringify({
        type: 'sessionKeyVerifyerUpd',
        content: this.sessionKey
      }));
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

      this.cancelSync();
    });

    this.messageSubject.pipe(
      filter(object => object.type === 'fullySynced')
    ).subscribe(async () => {
      this.isPartnerFully = true;
    });

    this.messageSubject.pipe(
      filter(object => object.type === 'startSync'),
      map(object => object.content),
    ).subscribe(async content => {
      console.log('start sync');
      if (!content) { // other partner
        this.reset();
      }
      this.startSync();
    });
  }

  public async trySignTransaction(currencyWallet: CurrencyWallet, tx: any) {
    console.log('qwewqeqweq');
    this.currencyWallet = currencyWallet;
    this.tx = tx;
    if (this.partnerDevice !== null) {
      this.isTransactionReconnect = true;
      if (!await this.bt.connect(this.partnerDevice.value)) {
        this.isTransactionReconnect = false;
        this.currencyWallet = null;
        this.tx = null;
      }
    }

    return this.isTransactionReconnect;
  }

  // ��� ����������������� � ������ �����������/������
  public async reset() {
    console.log('reset');
    if (this.status.getValue() === WalletStatus.None) {
      return;
    }

    this.coinIndex = 0;
    this.tokenIndex = 0;
    this.currencyWallet = null;
    this.tx = null;
    this.isTransactionReconnect = null;
    this.changeStatus();
    this.syncProgress.next(0);
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public async resetSession() {
    console.log('resetSession');
    this.sessionKey = Buffer.from('');
    this.sessionPartnerKey = Buffer.from('');
    this.partnerDevice.next(null);
  }

  public setProgress(value: number): void {
    this.syncProgress.next(Math.min(100, Math.max(0, Math.round(100 * value))));
  }

  public async sendSessionKey(isVerifyer: boolean) {
    try {
      console.log(this.sessionKey);
      if (this.sessionKey.equals(Buffer.from(''))) {
        console.log('first generate sessionKey');
        this.sessionKey = Buffer.from(new Date().toString());
      }

      if (await this.bt.send(JSON.stringify({
          type: isVerifyer ? 'sessionKeyVerifyer' : 'sessionKey',
          content: this.sessionKey
        }))) {
      } else {
        console.log('error sessionKey');
      }

    } catch (e) {
      console.log(e);
      this.synchronizing.next(false);
      this.changeStatus();
      this.bt.disconnect();
    }
  }

  public async startSync() {
    try {
      this.isPartnerFully = false;
      this.partnerDevice.next(this.bt.connectedDevice.value);

      this.setProgress(0);
      this.synchronizing.next(true);

      const paillierKeys = await CompoundKeyEcdsa.generatePaillierKeys(this.workerService.worker);

      this.setProgress(0.1);

      this.coinIndex = 0;
      for (const wallet of Array.from(this.coinWallets.values())) {
        if (!this.synchronizing.value) {
          return;
        }

        if (!wallet.ready.value) {
          const sub = wallet.syncProgress.subscribe(num => {
            this.setProgress(0.1 + 0.8 * (this.coinIndex + num / 100) / this.coinWallets.size);
          });
          this.changeStatus();
          await wallet.sync({ paillierKeys });
          sub.unsubscribe();
        } else {
          console.log('skip');
          this.setProgress(0.1 + 0.8 * (this.coinIndex + 1) / this.coinWallets.size);
        }
        await timer(100).toPromise();

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

        if (!wallet.ready.value) {
          await wallet.syncDuplicate(ethWallet);
          this.setProgress(0.9 + 0.1 * (this.tokenIndex + 1) / this.tokenWallets.size);
          this.changeStatus();
        } else {
          console.log('skip');
          this.setProgress(0.1 + 0.8 * (this.coinIndex + 1) / this.tokenWallets.size);
        }

        this.tokenIndex++;
      }

      this.setProgress(1);

      if (this.synchronizing.value) {
        console.log('fully sync');

        await this.bt.send(JSON.stringify({
          type: 'fullySynced',
          content: {}
        }));

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
    console.log('cancel sync ' + this.isPartnerFully);
    if (!this.synchronizing.value || this.isPartnerFully) {
      return;
    }

    try {
      for (const wallet of Array.from(this.coinWallets.values())) {
        if (!wallet.ready.value && !wallet.none.value) {
          await wallet.reset();
        }
      }

      for (const wallet of Array.from(this.tokenWallets.values())) {
        if (!wallet.ready.value && !wallet.none.value) {
          await wallet.reset();
        }
      }
    } catch (ignored) {
    }

    this.synchronizing.next(false);
    await this.bt.disconnect();
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
        this.workerService.worker,
        token,
        contractAddress,
        decimals,
      ));
  }

  async openUpdateKeyDialog() {
    navigator.notification.confirm(
      'You are about to connect with another device. This will undo current synchronization progress. Are you sure?',
      async (buttonIndex) => {
        if (buttonIndex === 1) { // yes

          console.log('sessionKey update');
          this.sessionKey = Buffer.from(new Date().toString());
          await this.bt.send(JSON.stringify({
            type: 'sessionKeyUpd',
            content: this.sessionKey
          }));
        } else {
          await this.cancelSync();
        }
      },
      '',
      ['YES', 'NO']
    );
  }

  async openPairedDeviceChangeDialog() {
    navigator.notification.confirm(
      'Confirmation device was changed. Please, syncronize your wallet again.',
      async (buttonIndex) => {
        if (buttonIndex === 1) { // yes

          console.log('go to connect');
          this.mustResync.next(true);
        } else {
          this.mustResync.next(false);
        }
      },
      '',
      ['YES', 'NO']
    );
  }
}
