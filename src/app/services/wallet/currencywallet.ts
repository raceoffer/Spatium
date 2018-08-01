import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, mapTo, skip } from 'rxjs/operators';
import * as WalletAddressValidator from 'wallet-address-validator';
import { toBehaviourSubject } from '../../utils/transformers';
import { ConnectionProviderService } from '../connection-provider';
import { Coin, KeyChainService, Token } from '../keychain.service';

export enum Status {
  None = 0,
  Cancelled,
  Failed,
  Synchronizing,
  Ready
}

export enum BalanceStatus {
  None = 0,
  Loading,
  Error
}

export enum TransactionType {
  In,
  Out
}

export class HistoryEntry {
  constructor(public type: TransactionType,
              public from: string,
              public to: string,
              public amount: number,
              public confirmed: boolean,
              public time: number) {}

  static fromJSON(json) {
    return new HistoryEntry(
      json.type === 'Out' ? TransactionType.Out : TransactionType.In,
      json.from,
      json.to,
      json.amount,
      json.confirmed,
      json.time
    );
  }
}

export class Balance {
  constructor(public confirmed: any,
              public unconfirmed: any) {}
}

export function getRandomDelay(min: number = 1000, max: number = 5000) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export abstract class CurrencyWallet {
  public status = new BehaviorSubject<Status>(Status.None);

  public synchronizing = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.Synchronizing)
    ), false);

  public ready = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.Ready)
    ), false);

  public none = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.None)
    ), true);

  public statusChanged = this.status.pipe(skip(1), distinctUntilChanged());

  public synchronizingEvent = this.statusChanged.pipe(filter(status => status === Status.Synchronizing), mapTo(null));
  public cancelledEvent = this.statusChanged.pipe(filter(status => status === Status.Cancelled), mapTo(null));
  public failedEvent = this.statusChanged.pipe(filter(status => status === Status.Failed), mapTo(null));
  public readyEvent = this.statusChanged.pipe(filter(status => status === Status.Ready), mapTo(null));

  public startVerifyEvent = new Subject<any>();
  public verifyEvent = new Subject<any>();
  public signedEvent = new Subject<any>();
  public acceptedEvent = new Subject<any>();
  public rejectedEvent = new Subject<any>();

  public syncProgress = new BehaviorSubject<number>(0);

  public address = new BehaviorSubject<string>(null);
  public balance = new BehaviorSubject<Balance>(null);
  public balanceStatus = new BehaviorSubject<BalanceStatus>(BalanceStatus.None);

  constructor(
    protected network: string,
    protected keychain: KeyChainService,
    protected currency: Coin,
    protected account: number,
    protected messageSubject: any,
    protected connectionProviderService: ConnectionProviderService,
    protected worker: any
  ) {
    this.synchronizingEvent.subscribe(() => this.syncProgress.next(0));

    this.messageSubject.pipe(
      filter((obj: any) => obj.type === 'cancelTransaction')
    ).subscribe(async () => {
      // pop the queue
      this.messageSubject.next({});

      await this.cancelSign();
    });
  }

  public abstract toInternal(amount: number): any;

  public abstract fromInternal(amount: any): number;

  public abstract fromJSON(ignored);

  public abstract async cancelSync();

  public abstract async cancelSign();

  public async rejectTransaction() {
    try {
      await this.connectionProviderService.send(JSON.stringify({
        type: 'cancelTransaction',
        content: {}
      }));
    } catch (ignored) {
    }

    await this.cancelSign();
  }

  public abstract async acceptTransaction();

  public abstract async sync(options: any);

  public abstract async syncDuplicate(other: CurrencyWallet);

  public abstract async finishSync(data: any);

  public async reset() {
    this.address.next(null);
    this.status.next(Status.None);

    this.balance.next(null);
    this.balanceStatus.next(BalanceStatus.None);
  }

  public currencyCode(): Coin | Token {
    return this.currency;
  }

  public verifyAddress(address: string, symbol: string): boolean {
    return WalletAddressValidator.validate(
      address,
      symbol,
      this.network === 'main' ? 'prod' : 'testnet'
    );
  }

  public abstract async requestTransactionVerify(transaction);

  public abstract async startTransactionVerify(transaction);

  public abstract async verifySignature();

  public abstract async listTransactionHistory();

  public abstract async createTransaction(address: string, value: any, fee?: any);

  public abstract async pushTransaction();
}
