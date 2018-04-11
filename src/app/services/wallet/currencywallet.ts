import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { BluetoothService } from '../bluetooth.service';
import { SynchronizationStatus, SyncSession } from './syncsession';
import { SignSession } from './signingsession';
import { Subject } from 'rxjs/Subject';
import { Coin, KeyChainService, Token } from '../keychain.service';
import { NgZone } from '@angular/core';

import { toBehaviourSubject } from '../../utils/transformers';

declare const CryptoCore: any;

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

export class CurrencyWallet {
  public compoundKey: any = null;
  public publicKey: any = null;

  protected syncSession: SyncSession = null;
  protected signSession: SignSession = null;

  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);
  public synchronizing: BehaviorSubject<boolean> = toBehaviourSubject(this.status.map(status => status === Status.Synchronizing), false);
  public ready: BehaviorSubject<boolean> = toBehaviourSubject(this.status.map(status => status === Status.Ready), false);

  public statusChanged: Observable<Status> = this.status.skip(1).distinctUntilChanged();

  public synchronizingEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
  public cancelledEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
  public failedEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
  public readyEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

  public startVerifyEvent: Subject<any> = new Subject<any>();
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
    this.synchronizingEvent.subscribe(() => this.syncProgress.next(0));

    this.messageSubject
      .filter(object => object.type === 'cancelTransaction')
      .subscribe(async () => {
        // pop the queue
        this.messageSubject.next({});

        if (this.signSession) {
          await this.signSession.cancel();
          this.signSession = null;
        }
      });
  }

  public toInternal(amount: number): string {
    return '';
  }

  public fromInternal(amount: string): number {
    return 0;
  }

  public fromJSON(ignored) {
    return null;
  }

  public async sync(paillierKeys: any) {
    this.compoundKey = await CryptoCore.CompoundKey.fromOptions({
      localPrivateKey: await CryptoCore.CompoundKey.keyFromSecret(this.keychain.getCoinSecret(this.currency, this.account)),
      localPaillierKeys: paillierKeys
    });

    const prover = await this.compoundKey.startInitialCommitment();

    this.status.next(Status.Synchronizing);
    this.syncSession = new SyncSession(prover, this.messageSubject, this.bt);
    this.syncSession.status.subscribe(state => {
      this.syncProgress.next(
        Math.max(Math.min(Math.round(state * 100 / (SynchronizationStatus.Finished - SynchronizationStatus.None + 1)), 100), 0)
      );
    });
    this.syncSession.canceled.subscribe(() => {
      this.status.next(Status.Cancelled);
      this.syncSession = null;
    });
    this.syncSession.failed.subscribe(() => {
      this.status.next(Status.Failed);
      this.syncSession = null;
    });

    const data = await this.syncSession.sync();
    this.syncSession = null;

    await this.finishSync(data);
  }

  public async reset() {
    this.status.next(Status.None);

    this.compoundKey = null;
    this.publicKey = null;

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
      this.syncSession = null;
    }
  }

  public async rejectTransaction() {
    try {
      await this.bt.send(JSON.stringify({
        type: 'cancelTransaction',
        content: {}
      }));
    } catch (ignored) { }

    if (this.signSession) {
      await this.signSession.cancel();
      this.signSession = null;
    }
  }

  public async acceptTransaction() {
    if (this.signSession) {
      await this.signSession.submitChiphertexts();
    }
  }

  public async syncDuplicate(other: CurrencyWallet) {
    this.compoundKey = other.compoundKey;
    this.publicKey = other.publicKey;
  }

  public async finishSync(data) {
    await this.compoundKey.finishInitialSync(data);
    this.publicKey = await this.compoundKey.getCompoundPublicKey();
  }

  public currencyCode(): Coin | Token  {
    return this.currency;
  }

  public async requestTransactionVerify(transaction) {
    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content: {
        tx: await transaction.toJSON(),
        coin: this.currencyCode()
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

    this.startVerifyEvent.next();

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

    this.signSession.sync().catch((e) => { console.log(e); });
  }

  public async verifySignature() {
    let verify = false;

    if (this.signSession) {
      verify = await this.signSession.transaction.verify();
    }

    return verify;
  }

  public async listTransactionHistory() {
    return [];
  }

  public async createTransaction(
    address: string,
    value: number,
    fee?: number
  ) {
    return null;
  }

  public async pushTransaction() { }
}
