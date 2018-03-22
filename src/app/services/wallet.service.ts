import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { Coin, Token, KeyChainService } from './keychain.service';
import { combineLatest } from 'rxjs/observable/combineLatest';

import { CurrencyWallet, Status } from './wallet/currencywallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { EthereumCurrencyWallet } from './wallet/ethereum/ethereumwallet';
import { ERC20CurrencyWallet } from './wallet/ethereum/erc20wallet';

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
      new EthereumCurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.tokenWallets.set(
      Token.EOS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.EOS,
        '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0'
      ));
    this.tokenWallets.set(
      Token.TRON,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.TRON,
        '0xf230b790e05390fc8295f4d3f60332c93bed42e2'
      ));
    this.tokenWallets.set(
      Token.VECHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.VECHAIN,
        '0xd850942ef8811f2a866692a623011bde52a462c1'
      ));
    this.tokenWallets.set(
      Token.ICON,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ICON,
        '0xb5a5f22694352c15b00323844ad545abb2b11028'
      ));
    this.tokenWallets.set(
      Token.OMNISEGO,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.OMNISEGO,
        '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
      ));
    this.tokenWallets.set(
      Token.BINACLECOIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BINACLECOIN,
        '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
      ));
    this.tokenWallets.set(
      Token.DIGIXDAO,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DIGIXDAO,
        '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'
      ));
    this.tokenWallets.set(
      Token.POPULUS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.POPULUS,
        '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a'
      ));
    this.tokenWallets.set(
      Token.RCHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.RCHAIN,
        '0x168296bb09e24a88805cb9c33356536b980d3fc5'
      ));
    this.tokenWallets.set(
      Token.MAKER,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.MAKER,
        '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
      ));
    this.tokenWallets.set(
      Token.AETHERNITY,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.AETHERNITY,
        '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d'
      ));

    for (const coin of Array.from(this.coinWallets.keys())) {
      this.currencyWallets.set(coin, this.coinWallets.get(coin));
    }
    for (const token of Array.from(this.tokenWallets.keys())) {
      this.currencyWallets.set(token, this.tokenWallets.get(token));
    }

    this.status = combineLatest(
      Array.from(this.coinWallets.values()).map(wallet => wallet.status),
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
        if (values.some(value => value === Status.Synchronizing)) {
          return Status.Synchronizing;
        }
        return Status.None;
      }
    );

    this.synchronizing = combineLatest(
      Array.from(this.coinWallets.values()).map(wallet => wallet.synchronizing),
      (... values) => {
        return values.reduce((a, b) => a || b, false);
      }
    );

    this.ready = combineLatest(
      Array.from(this.coinWallets.values()).map(wallet => wallet.ready),
      (... values) => {
        return values.reduce((a, b) => a && b, true);
      }
    );

    this.syncProgress = combineLatest(
      Array.from(this.coinWallets.values()).map(wallet => wallet.syncProgress),
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
        const wallet = this.currencyWallets.get(content.coin);
        return await wallet.startTransactionVerify(wallet.fromJSON(content.tx));
      });
  }

  public async reset() {
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public async startSync() {
    for (const wallet of Array.from(this.coinWallets.values())) {
      const syncEvent = wallet.readyEvent.take(1).takeUntil(combineLatest(this.cancelledEvent, this.failedEvent)).toPromise();

      await wallet.sync();

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
}

