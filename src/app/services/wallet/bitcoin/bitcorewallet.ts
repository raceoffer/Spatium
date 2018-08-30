import { from, of, timer } from 'rxjs';
import { catchError, expand, map, mergeMap, tap, filter } from 'rxjs/operators';
import { ConnectionProviderService } from '../../connection-provider';
import { Coin, KeyChainService } from '../../keychain.service';
import { LoggerService } from '../../logger.service';
import { Balance, HistoryEntry, Status, getRandomDelay, BalanceStatus } from '../currencywallet';
import { EcdsaCurrencyWallet } from '../ecdsacurrencywallet';
import * as $ from 'jquery';

export class BitcoreWallet extends EcdsaCurrencyWallet {
  private wallet: any = null;
  private routineTimerSub: any = null;
  private timeEnd: any = null;
  private transactionList: HistoryEntry[] = null;

  constructor(
    private Transaction: any,
    private Wallet: any,
    private endpoint: string,
    network: string,
    keychain: KeyChainService,
    coin: Coin,
    account: number,
    messageSubject: any,
    connectionProviderService: ConnectionProviderService,
    worker: any
  ) {
    super(
      network,
      keychain,
      coin, account,
      messageSubject,
      connectionProviderService,
      worker
    );
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
      point: this.publicKey,
      network: this.network,
      endpoint: this.endpoint,
    });

    const request = () => {
      this.balanceStatus.next(BalanceStatus.Loading);
      return from(this.wallet.getBalance()).pipe(
        tap(() => {
          this.balanceStatus.next(BalanceStatus.None);
        }),
        catchError(e => {
          this.balanceStatus.next(BalanceStatus.Error);
          return of(null);
        })
      );
    };

    this.address.next(this.wallet.address);
    this.routineTimerSub = timer(getRandomDelay()).pipe(
      mergeMap(() =>
        request().pipe(
          expand(() =>
            timer(60000).pipe(
              mergeMap(() => request())
            )
          )
        )
      ),
      filter(r => !!r),
      map((balance: any) => new Balance(
        balance.confirmed,
        balance.unconfirmed
      ))
    ).subscribe(balance => this.balance.next(balance));

    this.status.next(Status.Ready);
  }

  public async listTransactionHistory(to, from) {
    if (this.wallet === null) {
      return null;
    }

    if (this.transactionList === null) {
      const txs = await this.wallet.getTransactions(to, from);
      let txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));

      this.transactionList = txsMapped;  
    }
    else if (from === 0) {
      const txs = await this.wallet.getTransactions(to, from);
      let txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));

      if (txsMapped.length > 0) {
        if (txsMapped.slice(-1)[0].time <= this.transactionList[0].time) {
          let timeEnd = this.transactionList[0].time;
          let filtered = $.grep(txsMapped, function( item: HistoryEntry, index) {
            return ( item.time > timeEnd);
          });

          this.transactionList.unshift.apply(this.transactionList, filtered);
        }
        else {
          this.timeEnd = this.transactionList[0].time;
          this.transactionList.unshift.apply(this.transactionList, txsMapped);       
        }   
      }
    }
    else {
      if (this.timeEnd !== null && this.timeEnd < to) {
        const txs = await this.wallet.getTransactions(to, from);
        let txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));

        if (txsMapped.slice(-1)[0].time <= this.transactionList[0].time) {
          let timeEnd = this.transactionList[0].time;
          let filtered = $.grep(txsMapped, function( item: HistoryEntry, index) {
            return ( item.time > timeEnd);
          });

          Array.prototype.splice.apply(this.transactionList, [to,0].concat(filtered));
          this.timeEnd = null;
        }
        else {
          Array.prototype.splice.apply(this.transactionList, [to,0].concat(txsMapped));
        }   
      }
      else if (this.transactionList.length < to) {
        const txs = await this.wallet.getTransactions(to, from);
        let txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));
        this.transactionList.push.apply(this.transactionList, txsMapped);
      }
    }

    if (this.transactionList.length >= to) {
      return this.transactionList.slice(from, to);
    } else {
      return this.transactionList;
    }
  }

  public async createTransaction(address: string,
                                 value: any,
                                 fee?: any) {
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
