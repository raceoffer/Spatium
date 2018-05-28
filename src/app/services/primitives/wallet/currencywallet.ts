import { BehaviorSubject,  Observable,  Subject } from 'rxjs';
import { ConnectivityService } from '../../connectivity.service';
import { SynchronizationStatus, SyncSession } from './syncsession';
import { SignSession } from './signingsession';
import { Coin, KeyChainService, Token } from '../../keychain.service';
import { NgZone } from '@angular/core';

import { toBehaviourSubject } from '../../../utils/transformers';

import { CompoundKey } from 'crypto-core-async';
import { filter, skip, map, distinctUntilChanged, mapTo } from 'rxjs/operators';

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

export class CurrencyWallet {
  public compoundKey: any = null;
  public publicKey: any = null;

  protected syncSession: SyncSession = null;
  protected signSession: SignSession = null;

  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);

  public synchronizing: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.Synchronizing)
    ), false);

  public ready: BehaviorSubject<boolean> = toBehaviourSubject(
    this.status.pipe(
      map(status => status === Status.Ready)
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
    private keychain: KeyChainService,
    private currency: Coin,
    private account: number,
    private connectivityService: ConnectivityService,
    protected ngZone: NgZone
  ) {
    this.synchronizingEvent.subscribe(() => this.syncProgress.next(0));

    this.connectivityService.message.pipe(
      filter((obj: any) => obj.type === 'cancelTransaction')
    ).subscribe(async () => {
        // pop the queue
        this.connectivityService.message.next({});

        if (this.signSession) {
          await this.signSession.cancel();
          this.signSession = null;
        }
      });
  }

  public toInternal(amount: number): any {
    return 0;
  }

  public fromInternal(amount: any): number {
    return 0;
  }

  public fromJSON(ignored) {
    return null;
  }

  public async sync(paillierKeys: any) {
    this.compoundKey = await CompoundKey.fromOptions({
      localPrivateKey: await CompoundKey.keyFromSecret(this.keychain.getCoinSecret(this.currency, this.account)),
      localPaillierKeys: paillierKeys
    });

    const prover = await this.compoundKey.startInitialCommitment();

    this.status.next(Status.Synchronizing);
    this.syncSession = new SyncSession(prover, this.connectivityService);
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

    this.address.next(null);
    this.balance.next(null);
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
      await this.connectivityService.send({
        type: 'cancelTransaction',
        content: {}
      });
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

  public verifyAddress(address: string): boolean {
    return address && address.length > 0;
  }

  public async requestTransactionVerify(transaction) {
    await this.connectivityService.send({
      type: 'verifyTransaction',
      content: {
        tx: await transaction.toJSON(),
        coin: this.currencyCode()
      }
    });

    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.connectivityService
    );

    this.signSession.ready.subscribe(async () => {
      await this.signSession.awaitConfirmation();
    });
    this.signSession.canceled.subscribe(async () => {
      console.log('canceled');
      this.connectivityService.message.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.failed.subscribe(async () => {
      console.log('failed');
      this.connectivityService.message.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.signed.subscribe(async () => {
      console.log('signed');
      this.connectivityService.message.next({});
      this.acceptedEvent.next();
      this.signedEvent.next();
    });

    this.signSession.sync().catch(() => {});
  }

  public async startTransactionVerify(transaction) {
    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.connectivityService
    );

    this.startVerifyEvent.next();

    this.signSession.ready.subscribe(() => {
      this.verifyEvent.next(transaction);
    });
    this.signSession.canceled.subscribe(() => {
      this.connectivityService.message.next({});
      this.signSession = null;
      this.rejectedEvent.next();
    });
    this.signSession.failed.subscribe(() => {
      this.connectivityService.message.next({});
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
    value: any,
    fee?: any
  ) {
    return null;
  }

  public async pushTransaction() { }
}
