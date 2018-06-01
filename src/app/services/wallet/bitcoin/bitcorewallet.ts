import { Balance, CurrencyWallet, HistoryEntry, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

import { from, of, timer } from 'rxjs';
import { expand, map, mergeMap, filter, catchError } from 'rxjs/operators';

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
    ngZone: NgZone,
    worker: any
  ) {
    super(network, keychain, coin, account, messageSubject, bt, ngZone, worker);
  }

  public async reset() {
    await super.reset();

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }

    this.wallet = null;
  }

  public toInternal(amount: number): any {
    return this.wallet.toInternal(amount);
  }

  public fromInternal(amount: any): number {
    return this.wallet.fromInternal(amount);
  }

  public fromJSON(tx) {
    return this.Transaction.fromJSON(tx, this.worker);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.wallet = await this.Wallet.fromOptions({
      key: this.publicKey,
      network: this.network,
      endpoint: this.endpoint,
    });

    const request = () => from(this.wallet.getBalance()).pipe(
        catchError(e => of(null)));

    this.address.next(this.wallet.address);
    this.routineTimerSub = timer(1000).pipe(
      mergeMap(() =>
        request().pipe(
          expand(() =>
            timer(20000).pipe(
              mergeMap(() => request())
            )
          )
        )
      ),
      filter(r => r),
      map((balance: any) => new Balance(
        balance.confirmed,
        balance.unconfirmed
      ))
    ).subscribe(balance => this.balance.next(balance));

    this.status.next(Status.Ready);
  }

  public verifyAddress(address: string): boolean {
    return address &&
           /^([135KLmn29с]|xpub|xprv|tpub|tprv)[a-km-zA-HJ-NP-Z1-9]{25,111}$/.test(address);
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
    value: any,
    fee?: any
  ) {
    try {
      return await this.wallet.prepareTransaction(
        await this.Transaction.create(this.worker),
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
