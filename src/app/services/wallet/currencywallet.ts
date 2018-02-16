import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { BluetoothService } from '../bluetooth.service';
import { LoggerService } from '../logger.service';
import { SynchronizationStatus, SyncSession } from './syncsession';
import { SignSession } from './signingsession';
import { Subject } from 'rxjs/Subject';
import { Coin, KeyChainService } from '../keychain.service';
import { NgZone } from '@angular/core';

declare const bcoin: any;
declare const CompoundKey: any;

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
      json.type,
      json.from,
      json.to,
      json.amount,
      bcoin.amount.btc(json.amount),
      json.confirmed,
      json.time
    );
  }

  constructor(
    public type: TransactionType,
    public from: string,
    public to: string,
    public amount: number,
    public formattedAmount: number,
    public confirmed: boolean,
    public time: number
  ) {}
}

export class CurrencyWallet {
  protected compoundKey: any = null;

  protected syncSession: SyncSession = null;
  protected signSession: SignSession = null;

  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);
  public synchronizing: Observable<boolean> = this.status.map(status => status === Status.Synchronizing);
  public ready: Observable<boolean> = this.status.map(status => status === Status.Ready);

  public statusChanged: Observable<Status> = this.status.skip(1).distinctUntilChanged();

  public synchronizingEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
  public cancelledEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
  public failedEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
  public readyEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

  public verifyEvent: Subject<any> = new Subject<any>();
  public signedEvent: Subject<any> = new Subject<any>();
  public acceptedEvent: Subject<any> = new Subject<any>();
  public rejectedEvent: Subject<any> = new Subject<any>();

  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  public address: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public balance: BehaviorSubject<any> = new BehaviorSubject<any>({ confirmed: 0, unconfirmed: 0 });
  public transactions: BehaviorSubject<Array<HistoryEntry>> = new BehaviorSubject<Array<HistoryEntry>>([]);

  constructor(
    protected network: string,
    private keychain: KeyChainService,
    private currency: Coin,
    private account: number,
    private messageSubject: any,
    private bt: BluetoothService,
    protected ngZone: NgZone
  ) {
    this.bt.disconnectedEvent.subscribe(() => this.status.next(Status.None));

    this.synchronizingEvent.subscribe(() => this.syncProgress.next(0));
  }

  public sync() {
    if (this.status.getValue() === Status.Synchronizing) {
      LoggerService.log('Sync in progress', {});
      return;
    }

    this.compoundKey = new CompoundKey({
      localPrivateKeyring: CompoundKey.keyringFromSecret(this.keychain.getCoinSecret(this.currency, this.account))
    });

    let prover = null;
    try {
      prover = this.compoundKey.startInitialCommitment();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start initial commitment', e);
      return;
    }

    this.status.next(Status.Synchronizing);
    this.syncSession = new SyncSession(prover, this.messageSubject, this.bt);
    this.syncSession.status.subscribe(state => {
      this.syncProgress.next(
        Math.max(Math.min(Math.round(state * 100 / (SynchronizationStatus.Finished - SynchronizationStatus.None + 1)), 100), 0)
      );
    });
    this.syncSession.canceled.subscribe(() => {
      // pop the queue
      this.messageSubject.next({});
      this.status.next(Status.Cancelled);
      this.syncSession = null;
    });
    this.syncSession.failed.subscribe(() => {
      // pop the queue
      this.messageSubject.next({});
      this.status.next(Status.Failed);
      this.syncSession = null;
    });
    this.syncSession.finished.subscribe(async (data) => {
      // pop the queue
      this.messageSubject.next({});
      this.syncSession = null;
      await this.finishSync(data);
    });
    // We'll handle it via events instead
    this.syncSession.sync().catch(() => {});
  }

  public async reset() {
    this.status.next(Status.None);

    this.compoundKey = null;

    if (this.syncSession) {
      await this.syncSession.cancel();
      this.syncSession = null;
    }

    if (this.signSession) {
      await this.signSession.cancel();
      this.signSession = null;
    }

    this.address.next('');
    this.balance.next({ confirmed: 0, unconfirmed: 0 });
    this.transactions.next([]);
    this.syncProgress.next(0);
  }

  public async cancelSync() {
    if (this.syncSession) {
      await this.syncSession.cancel();
    }
  }

  public async rejectTransaction() {
    if (this.signSession) {
      await this.signSession.cancel();
    }
  }

  public async acceptTransaction() {
    if (this.signSession) {
      await this.signSession.submitChiphertexts();
    }
  }

  public async finishSync(data) {
    try {
      this.compoundKey.finishInitialSync(data);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed synchronization finish', e);
    }
  }

  public async requestTransactionVerify(transaction) {
    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content: {
        tx: transaction.toJSON(),
        coin: this.currency
      }
    }));

    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.messageSubject,
      this.bt
    );

    this.signSession.ready.subscribe(async () => {
      await this.signSession.awaitConfirmation();
    });
    this.signSession.canceled.subscribe(async () => {
      console.log('canceled');
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.failed.subscribe(async () => {
      console.log('failed');
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.signed.subscribe(async () => {
      console.log('signed');
      this.messageSubject.next({});
      this.acceptedEvent.next();
      this.signedEvent.next();
    });

    this.signSession.sync().catch(() => {});
  }

  public async startTransactionVerify(transaction) {
    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.messageSubject,
      this.bt
    );

    this.signSession.ready.subscribe(() => {
      this.verifyEvent.next(transaction);
    });
    this.signSession.canceled.subscribe(() => {
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.failed.subscribe(() => {
      this.messageSubject.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });

    this.signSession.sync().catch(() => {});
  }

  public async verifySignature() {
    let verify = false;

    if (this.signSession) {
      verify = this.signSession.transaction.verify();
    }

    return verify;
  }

  public async createTransaction(address, value) {
    return null;
  }

  public async pushTransaction() { }
}
