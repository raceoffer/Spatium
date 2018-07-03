import { BehaviorSubject,  Observable,  Subject } from 'rxjs';
import { BluetoothService } from '../bluetooth.service';
import { SignSession } from './ecdsa/signingsession';
import { Coin, KeyChainService, Token } from '../keychain.service';

import { toBehaviourSubject } from '../../utils/transformers';

import { filter, skip, map, distinctUntilChanged, mapTo } from 'rxjs/operators';
import * as WalletAddressValidator from 'wallet-address-validator';

export enum Status {
  None = 0,
  Cancelled,
  Failed,
  Synchronizing,
  Ready
}

export enum TransactionType {
  In,
  Out
}

export class HistoryEntry {
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

  constructor(
    public type: TransactionType,
    public from: string,
    public to: string,
    public amount: number,
    public confirmed: boolean,
    public time: number
  ) {}
}

export class Balance {
  constructor(
    public confirmed: any,
    public unconfirmed: any
  ) {}
}

export abstract class CurrencyWallet {
  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);

  public synchronizing: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.Synchronizing)
    ), false);

  public ready: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.Ready)
    ), false);

  public none: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.None)
    ), false);

  public statusChanged: Observable<Status> = this.status.pipe(skip(1), distinctUntilChanged());

  public synchronizingEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Synchronizing), mapTo(null));
  public cancelledEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Cancelled), mapTo(null));
  public failedEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Failed), mapTo(null));
  public readyEvent: Observable<any> = this.statusChanged.pipe(filter(status => status === Status.Ready), mapTo(null));

  public startVerifyEvent: Subject<any> = new Subject<any>();
  public verifyEvent: Subject<any> = new Subject<any>();
  public signedEvent: Subject<any> = new Subject<any>();
  public acceptedEvent: Subject<any> = new Subject<any>();
  public rejectedEvent: Subject<any> = new Subject<any>();

  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  public address: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public balance: BehaviorSubject<Balance> = new BehaviorSubject<Balance>(null);

  constructor(
    protected network: string,
    protected keychain: KeyChainService,
    protected currency: Coin,
    protected account: number,
    protected messageSubject: any,
    protected bt: BluetoothService,
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
      await this.bt.send(JSON.stringify({
        type: 'cancelTransaction',
        content: {}
      }));
    } catch (ignored) { }

    await this.cancelSign();
  }

  public abstract async acceptTransaction();

  public abstract async sync(options: any);
  public abstract async syncDuplicate(other: CurrencyWallet);
  public abstract async finishSync(data: any);

  public abstract async reset();

  public currencyCode(): Coin | Token  {
    return this.currency;
  }

  public verifyAddress(address: string, symbol: string): boolean {
    return WalletAddressValidator.validate(
      address,
      symbol,
      this.network == 'main' ? 'prod' : 'testnet'
    );
  }

  public abstract async requestTransactionVerify(transaction);
  public abstract async startTransactionVerify(transaction);

  public abstract async verifySignature();

  public abstract async listTransactionHistory();

  public abstract async createTransaction(address: string, value: any, fee?: any);
  public abstract async pushTransaction();
}
