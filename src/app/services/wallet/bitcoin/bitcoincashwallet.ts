import { CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

declare const bcoin: any;
declare const WatchingWallet: any;
declare const InsightProvider: any;
declare const BitcoinCashTransaction: any;

export class BitcoinCashWallet extends CurrencyWallet {
  private walletDB: any = null;
  private watchingWallet: any = null;
  private provider: any = null;
  private routineTimer: any = null;

  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(network, keychain, Coin.BCH, account, messageSubject, bt, ngZone);
  }

  public async reset() {
    await super.reset();

    if (this.routineTimer) {
      clearInterval(this.routineTimer);
    }

    this.walletDB = null;
    this.watchingWallet = null;
    this.provider = null;
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });

    try {
      this.address.next(this.compoundKey.getCompoundKeyAddress('base58'));
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get compound key address', e);
    }

    try {
      await this.walletDB.open();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed open database', e);
    }

    try {
      this.watchingWallet = await new WatchingWallet({
        accounts: [{
          name: this.compoundKey.getCompoundKeyAddress('base58'),
          key: this.compoundKey.compoundPublicKeyring
        }]
      }).load(this.walletDB);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create watching wallet', e);
    }

    this.watchingWallet.on('balance', (balance) => this.ngZone.run(() => {
      this.balance.next(balance);
    }));

    this.watchingWallet.on('transaction', (transaction) => {
      console.log(transaction);
    });

    try {
      this.balance.next(await this.watchingWallet.getBalance());
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get the balance', e);
    }

    // Start: configuring a provider
    this.provider = new InsightProvider({
      network: this.network
    });

    this.provider.on('transaction', async (hash, meta) => {
      let hex = await this.watchingWallet.getRawTransaction(hash);
      if (!hex) {
        hex = await this.provider.pullRawTransaction(hash);
      }
      await this.watchingWallet.addRawTransaction(hex, meta);
    });

    // Initiate update routine

    try {
      this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(() => {});
      clearInterval(this.routineTimer);
      this.routineTimer = setInterval(() => {
        this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(() => {});
      }, 20000);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to pull transactions into provider', e);
    }

    // End: configuring a provider

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value) {
    const transaction = BitcoinCashTransaction.fromOptions({
      network: this.network
    });

    /// Fill inputs and calculate script hashes
    try {
      await transaction.prepare({
        wallet: this.watchingWallet,
        address: address,
        value: value
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to prepare transaction', e);
    }

    return transaction;
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      try {
        const raw = this.signSession.transaction.toRaw();
        await this.provider.pushTransaction(raw);
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to push transaction', e);
      }
    }
  }
}
