import { Injectable, EventEmitter } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { LoggerService } from './logger.service';

declare const bcoin: any;

declare const CompoundKey: any;
declare const WatchingWallet: any;
declare const BlockchainInfoProvider: any;
declare const Transaction: any;
declare const Utils: any;

export enum SynchronizationStatus {
  None = 0,
  Started,
  InitialCommitment,
  InitialDecommitment,
  VerifierCommitment,
  ProverCommitment,
  VerifierDecommitment,
  ProverDecommitment,
  Finished
}

export enum TransactionStatus {
  None = 0,
  Started,
  EntropyCommitments,
  EntropyDecommitments,
  Ready,
  Signed,
  Cancelled,
  Failed
}

export enum Status {
  None = 0,
  Cancelled,
  Failed,
  Synchronizing,
  Ready
}

class SyncSession {
  public status: BehaviorSubject<SynchronizationStatus> = new BehaviorSubject<SynchronizationStatus>(SynchronizationStatus.None);

  private initialCommitmentObserver:    Observable<any>;
  private initialDecommitmentObserver:  Observable<any>;
  private verifierCommitmentObserver:   Observable<any>;
  private proverCommitmentObserver:     Observable<any>;
  private verifierDecommitmentObserver: Observable<any>;
  private proverDecommitmentObserver:   Observable<any>;

  public finished: EventEmitter<any> = new EventEmitter();
  public canceled: EventEmitter<any> = new EventEmitter();
  public failed:   EventEmitter<any> = new EventEmitter();

  private cancelObserver: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(
    private prover: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.initialCommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'initialCommitment')
        .map(object => object.content);

    this.initialDecommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'initialDecommitment')
        .map(object => object.content);

    this.verifierCommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'verifierCommitment')
        .map(object => object.content);

    this.proverCommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'proverCommitment')
        .map(object => object.content);

    this.verifierDecommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'verifierDecommitment')
        .map(object => object.content);

    this.proverDecommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'proverDecommitment')
        .map(object => object.content);

    this.messageSubject
        .filter(object => object.type === 'cancel')
        .subscribe(() => this.cancelObserver.next(true));
  }

  public async cancel() {
    this.cancelObserver.next(true);
    if (!await this.bt.send(JSON.stringify({
      type: 'cancel',
      content: {}
    }))) {
      LoggerService.nonFatalCrash('Failed to send cancel', null);
    }
  }

  public async sync() {
    const handleFailure = (message, exception) => {
      LoggerService.nonFatalCrash(message, exception);
      this.status.next(SynchronizationStatus.Finished);
      this.failed.emit();
      throw new Error(message);
    };

    const handleCancel = () => {
      LoggerService.log('Cancelled', {});
      this.status.next(SynchronizationStatus.Finished);
      this.canceled.emit();
      throw new Error('Cancelled');
    };

    this.status.next(SynchronizationStatus.Started);
    let initialCommitment = null;
    try {
      initialCommitment = this.prover.getInitialCommitment();
    } catch (e) {
      return handleFailure('Failed to get initialCommitment', e);
    }

    LoggerService.log('Sending initialCommitment:', initialCommitment);
    if (!await this.bt.send(JSON.stringify({
      type: 'initialCommitment',
      content: initialCommitment
    }))) {
      return handleFailure('Failed to send initialCommitment', null);
    }

    const remoteInitialCommitment = await this.initialCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteInitialCommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.InitialCommitment);
    LoggerService.log('Received remoteInitialCommitment', remoteInitialCommitment);
    let initialDecommitment = null;
    try {
      initialDecommitment = this.prover.processInitialCommitment(remoteInitialCommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteInitialCommitment', e);
    }

    LoggerService.log('Sending initialDecommitment', initialDecommitment);
    if (!await this.bt.send(JSON.stringify({
      type: 'initialDecommitment',
      content: initialDecommitment
    }))) {
      return handleFailure('Failed to send initialDecommitment', null);
    }

    const remoteInitialDecommitment = await this.initialDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteInitialDecommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.InitialDecommitment);
    LoggerService.log('Received remoteInitialDecommitment', remoteInitialDecommitment);
    let verifier = null;
    try {
      verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteInitialDecommitment', e);
    }

    const verifierCommitment = verifier.getCommitment();

    LoggerService.log('Sending verifierCommitment', verifierCommitment);
    if (!await this.bt.send(JSON.stringify({
      type: 'verifierCommitment',
      content: verifierCommitment
    }))) {
      return handleFailure('Failed to send verifierCommitment', null);
    }

    const remoteVerifierCommitment = await this.verifierCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteVerifierCommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.VerifierCommitment);
    LoggerService.log('Received remoteVerifierCommitment', remoteVerifierCommitment);
    let proverCommitment = null;
    try {
      proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteVerifierCommitment', e);
    }

    LoggerService.log('Sending proverCommitment', proverCommitment);
    if (!await this.bt.send(JSON.stringify({
      type: 'proverCommitment',
      content: proverCommitment
    }))) {
      return handleFailure('Failed to send proverCommitment', null);
    }

    const remoteProverCommitment = await this.proverCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteProverCommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.ProverCommitment);
    LoggerService.log('Received remoteProverCommitment', remoteProverCommitment);
    let verifierDecommitment = null;
    try {
      verifierDecommitment = verifier.processCommitment(remoteProverCommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteProverCommitment', e);
    }

    LoggerService.log('Sending verifierDecommitment', verifierDecommitment);
    if (!await this.bt.send(JSON.stringify({
      type: 'verifierDecommitment',
      content: verifierDecommitment
    }))) {
      return handleFailure('Failed to send verifierDecommitment', null);
    }

    const remoteVerifierDecommitment = await this.verifierDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteVerifierDecommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.VerifierDecommitment);
    LoggerService.log('Received remoteVerifierDecommitment', remoteVerifierDecommitment);
    let proverDecommitment = null;
    try {
      proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteVerifierDecommitment', e);
    }

    LoggerService.log('Sending proverDecommitment', proverDecommitment);
    if (!await this.bt.send(JSON.stringify({
      type: 'proverDecommitment',
      content: proverDecommitment
    }))) {
      return handleFailure('Failed to send proverDecommitment', null);
    }

    const remoteProverDecommitment = await this.proverDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteProverDecommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.ProverDecommitment);
    LoggerService.log('Received remoteProverDecommitment', remoteProverDecommitment);
    let verifiedData = null;
    try {
      verifiedData = verifier.processDecommitment(remoteProverDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteProverDecommitment', e);
    }

    this.status.next(SynchronizationStatus.Finished);
    this.finished.emit(verifiedData);

    return verifiedData;
  }
}

class SignSession {
  public status: BehaviorSubject<TransactionStatus> = new BehaviorSubject<TransactionStatus>(TransactionStatus.None);

  private entropyCommitmentsObserver:   Observable<any>;
  private entropyDecommitmentsObserver: Observable<any>;
  private chiphertextsObserver:         Observable<any>;

  public ready: EventEmitter<any> = new EventEmitter();
  public signed: EventEmitter<any> = new EventEmitter();

  public canceled: EventEmitter<any> = new EventEmitter();
  public failed:   EventEmitter<any> = new EventEmitter();

  private cancelObserver: ReplaySubject<boolean> = new ReplaySubject(1);

  private signers: any = null;

  constructor(
    private tx: any,
    private compoundKey: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.entropyCommitmentsObserver =
      this.messageSubject
        .filter(object => object.type === 'entropyCommitments')
        .map(object => object.content);

    this.entropyDecommitmentsObserver =
      this.messageSubject
        .filter(object => object.type === 'entropyDecommitments')
        .map(object => object.content);

    this.chiphertextsObserver =
      this.messageSubject
        .filter(object => object.type === 'chiphertexts')
        .map(object => object.content);

    this.messageSubject
      .filter(object => object.type === 'cancelTransaction')
      .subscribe(() => {
        this.cancelObserver.next(true);
        if (this.status.getValue() === TransactionStatus.Ready) {
          LoggerService.log('Cancelled after sync', {});
          this.status.next(TransactionStatus.Cancelled);
          this.canceled.emit();
        }
      });
  }

  public get transaction() {
    return this.tx;
  }

  private handleFailure(message, exception) {
    LoggerService.nonFatalCrash(message, exception);
    this.status.next(TransactionStatus.Failed);
    this.failed.emit();
    throw new Error(message);
  }

  private handleCancel() {
    LoggerService.log('Cancelled', {});
    this.status.next(TransactionStatus.Cancelled);
    this.canceled.emit();
    throw new Error('Cancelled');
  }

  public async cancel() {
    this.cancelObserver.next(true);
    if (!await this.bt.send(JSON.stringify({
        type: 'cancelTransaction',
        content: {}
      }))) {
      LoggerService.nonFatalCrash('Failed to send cancel', null);
    }
  }

  public async sync() {
    this.status.next(TransactionStatus.Started);

    const hashes = this.tx.getHashes();
    const map = this.tx.mapCompoundKeys(this.compoundKey);
    this.signers = Transaction.startSign(hashes, map);

    let entropyCommitments = null;
    try {
      entropyCommitments = Transaction.createEntropyCommitments(this.signers);
    } catch (e) {
      return this.handleFailure('Failed to get entropyCommitments', e);
    }

    LoggerService.log('Sending entropyCommitments', entropyCommitments);
    if (!await this.bt.send(JSON.stringify({
        type: 'entropyCommitments',
        content: entropyCommitments
      }))) {
      return this.handleFailure('Failed to send entropyCommitment', null);
    }

    const remoteEntropyCommitments = await this.entropyCommitmentsObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteEntropyCommitments) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyCommitments);
    LoggerService.log('Received remoteEntropyCommitments', remoteEntropyCommitments);
    let entropyDecommitments = null;
    try {
      entropyDecommitments = Transaction.processEntropyCommitments(this.signers, remoteEntropyCommitments);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyCommitment', e);
    }

    LoggerService.log('Sending entropyDecommitments', entropyDecommitments);
    if (!await this.bt.send(JSON.stringify({
        type: 'entropyDecommitments',
        content: entropyDecommitments
      }))) {
      return this.handleFailure('Failed to send entropyDecommitments', null);
    }

    const remoteEntropyDecommitments = await this.entropyDecommitmentsObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteEntropyDecommitments) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyDecommitments);
    LoggerService.log('Received remoteEntropyDecommitments', remoteEntropyDecommitments);
    try {
      Transaction.processEntropyDecommitments(this.signers, remoteEntropyDecommitments);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyDecommitments', e);
    }

    this.status.next(TransactionStatus.Ready);
    this.ready.emit();
  }

  public async submitChiphertexts() {
    if (this.status.getValue() !== TransactionStatus.Ready) {
      LoggerService.nonFatalCrash('Cannot submit non-synchronized tx', null);
      return;
    }

    let chiphertexts = null;
    try {
      chiphertexts = Transaction.computeCiphertexts(this.signers);
    } catch (e) {
      return this.handleFailure('Failed to compute chiphertexts', e);
    }

    LoggerService.log('Sending chiphertexts', chiphertexts);
    if (!await this.bt.send(JSON.stringify({
        type: 'chiphertexts',
        content: chiphertexts
      }))) {
      return this.handleFailure('Failed to send chiphertexts', null);
    }
  }

  public async awaitConfirmation() {
    if (this.status.getValue() !== TransactionStatus.Ready) {
      LoggerService.nonFatalCrash('Cannot await chiphertexts for non-synchronized tx', null);
      return;
    }

    const remoteChiphertexts = await this.chiphertextsObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteChiphertexts) {
      return this.handleCancel();
    }

    LoggerService.log('Received remoteChiphertexts', remoteChiphertexts);
    let signatures = null;
    try {
      signatures = Transaction.extractSignatures(this.signers, remoteChiphertexts).map(Utils.encodeSignature);
    } catch (e) {
      return this.handleFailure('Failed to process remoteChiphertexts', e);
    }

    this.tx.injectSignatures(signatures);
    this.status.next(TransactionStatus.Signed);
    this.signed.emit();
  }
}

@Injectable()
export class WalletService {
  private compoundKey: any = null;
  private walletDB: any = null;
  private watchingWallet: any = null;
  private provider: any = null;

  private routineTimer: any = null;

  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  private syncSession: SyncSession = null;
  private signSession: SignSession = null;

  private network = 'testnet'; // 'main'; | 'testnet';

  public secret: any = null;

  public address: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public balance: BehaviorSubject<any> = new BehaviorSubject<any>({ confirmed: 0, unconfirmed: 0 });

  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);
  public synchronizing: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public syncProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  public statusChanged: Observable<Status> = this.status.skip(1).distinctUntilChanged();

  public synchronizingEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
  public cancelledEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
  public failedEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
  public readyEvent: Observable<any> = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

  public onVerifyTransaction: EventEmitter<any> = new EventEmitter<any>();
  public onSigned: EventEmitter<any> = new EventEmitter<any>();
  public onAccepted: EventEmitter<any> = new EventEmitter<any>();
  public onRejected: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private bt: BluetoothService
  ) {
    bcoin.set(this.network);

    this.bt.message.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.bt.disconnectedEvent.subscribe(() => this.status.next(Status.None));

    this.messageSubject
      .filter(object => object.type === 'verifyTransaction')
      .map(object => object.content)
      .subscribe(async content => {
        return await this.startTransactionVerify(
          Transaction.fromJSON(content)
        );
      });

    this.status.subscribe(status => this.synchronizing.next(status === Status.Synchronizing));
    this.status.subscribe(status => this.ready.next(status === Status.Ready));
    this.synchronizingEvent.subscribe(() => this.syncProgress.next(0));

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });
  }

  public async reset() {
    this.status.next(Status.None);

    if (this.secret) {
      this.secret.fill(0);
      this.secret = null;
    }

    this.compoundKey = null;
    this.walletDB = null;
    this.watchingWallet = null;
    this.provider = null;

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
  }

  public startSync() {
    if (this.synchronizing.getValue()) {
      LoggerService.log('Sync in progress', {});
      return;
    }

    try {
      this.compoundKey = new CompoundKey({
        localPrivateKeyring: CompoundKey.keyringFromSecret(this.secret)
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create compound key', e);
      return;
    }

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
      console.log('received cancel event');
      // pop the queue
      this.messageSubject.next({});
      this.status.next(Status.Cancelled);
      this.syncSession = null;
    });
    this.syncSession.failed.subscribe(() => {
      console.log('received failed event');
      // pop the queue
      this.messageSubject.next({});
      this.status.next(Status.Failed);
      this.syncSession = null;
    });
    this.syncSession.finished.subscribe(async (data) => {
      console.log('received finished event');
      // pop the queue
      this.messageSubject.next({});
      this.syncSession = null;
      await this.finishSync(data);
    });
    // We'll handle it via events instead
    this.syncSession.sync().catch(() => {});
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

  public async createTransaction(address, value, substractFee) {
    const transaction = new Transaction({
      address: address,
      value: value
    });

    /// Fill inputs and calculate script hashes
    try {
      await transaction.prepare(this.watchingWallet, {
        subtractFee: substractFee
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to prepare transaction', e);
    }

    return transaction;
  }

  public async requestTransactionVerify(transaction) {
    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content:  transaction.toJSON()
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
      this.onRejected.emit();
    });
    this.signSession.failed.subscribe(async () => {
      console.log('failed');
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });
    this.signSession.signed.subscribe(async () => {
      console.log('signed');
      this.messageSubject.next({});
      this.onAccepted.emit();
      this.onSigned.emit();
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

    this.signSession.ready.subscribe(async () => {
      this.onVerifyTransaction.emit(transaction);
    });
    this.signSession.canceled.subscribe(async () => {
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });
    this.signSession.failed.subscribe(async () => {
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });

    this.signSession.sync().catch(() => {});
  }

  public async verifySignature() {
    let verify = false;

    if (this.signSession) {
      const tx = this.signSession.transaction.toTX();

      try {
        verify = tx.verify(await this.watchingWallet.wallet.getCoinView(tx));
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to verify signature', e);
      }
    }

    return verify;
  }

  public async pushTransaction() {
    if (this.signSession) {
      const tx = this.signSession.transaction.toTX();
      try {
        await this.provider.pushTransaction(tx.toRaw().toString('hex'));
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to push transaction', e);
      }
    }
  }

  private async finishSync(data) {
    try {
      this.compoundKey.finishInitialSync(data);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed synchronization finish', e);
    }

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

    this.watchingWallet.on('balance', (balance) => {
      this.balance.next(balance);
    });

    this.watchingWallet.on('transaction', (transaction) => {
      console.log(transaction);
    });

    try {
      this.balance.next(await this.watchingWallet.getBalance());
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get the balance', e);
    }

    // Start: configuring a provider
    this.provider = new BlockchainInfoProvider({
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
}

