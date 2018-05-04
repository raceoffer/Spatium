import { Balance, CurrencyWallet, HistoryEntry, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

import { Observable } from 'rxjs/Observable';

declare const Buffer: any;
declare const CryptoCore: any;

export class BitcoreWallet extends CurrencyWallet {
  private wallet: any = null;
  private routineTimerSub: any = null;

  constructor(
    private Transaction: any,
    private Wallet: any,
    private endpoint: string,
    network: string,
    keychain: KeyChainService,
    coin: Coin,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(network, keychain, coin, account, messageSubject, bt, ngZone);
  }

  public async reset() {
    await super.reset();

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }

    this.wallet = null;
  }

  public toInternal(amount: number): number {
    return this.wallet.toInternal(amount);
  }

  public fromInternal(amount: number): number {
    return this.wallet.fromInternal(amount);
  }

  public fromJSON(tx) {
    return this.Transaction.fromJSON(tx);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.wallet = await this.Wallet.fromOptions({
      key: this.publicKey,
      network: this.network,
      endpoint: this.endpoint,
    });

    this.address.next(this.wallet.address);

    this.routineTimerSub = Observable.timer(1000, 20000).subscribe(async () => {
      try {
        const balance = await this.wallet.getBalance();
        this.balance.next(new Balance(
          balance.confirmed,
          balance.unconfirmed
        ));
      } catch (ignored) {}
    });

    this.status.next(Status.Ready);
  }

  public async listTransactionHistory() {
    if (this.wallet === null) {
      return null;
    }

    const txs = await this.wallet.getTransactions();
    return txs.map(tx => HistoryEntry.fromJSON(tx));
  }

  public async createTransaction(
    address: string,
    value: number,
    fee?: number
  ) {
    try {
      return await this.wallet.prepareTransaction(
        new this.Transaction(),
        address,
        value,
        fee ? fee : undefined
      );
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to prepare transaction', e);
    }
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      try {
        const raw = await this.signSession.transaction.toRaw();
        await this.wallet.sendSignedTransaction(raw);
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to push transaction', e);
      }
    }
  }
}
