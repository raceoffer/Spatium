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

export enum Status {
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

class SyncSession {
  public status: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);

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
      this.status.next(Status.Finished);
      this.failed.emit();
      throw new Error(message);
    };

    const handleCancel = () => {
      LoggerService.log('Cancelled', {});
      this.status.next(Status.Finished);
      this.canceled.emit();
      throw new Error('Cancelled');
    };

    this.status.next(Status.Started);
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

    this.status.next(Status.InitialCommitment);
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

    this.status.next(Status.InitialDecommitment);
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

    this.status.next(Status.VerifierCommitment);
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

    this.status.next(Status.ProverCommitment);
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

    this.status.next(Status.VerifierDecommitment);
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

    this.status.next(Status.ProverDecommitment);
    LoggerService.log('Received remoteProverDecommitment', remoteProverDecommitment);
    let verifiedData = null;
    try {
      verifiedData = verifier.processDecommitment(remoteProverDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteProverDecommitment', e);
    }

    this.status.next(Status.Finished);
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
      .subscribe(() => this.cancelObserver.next(true));
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
  compoundKey: any = null;
  walletDB: any = null;
  watchingWallet: any = null;
  provider: any = null;

  routineTimer: any = null;

  localReady = false;
  remoteReady = false;

  address = null;
  balance = null;

  messageSubject: ReplaySubject<any> = new ReplaySubject<any>(2);

  syncSession: SyncSession = null;
  signSession: SignSession = null;

  network = 'testnet'; // 'main'; | 'testnet';

  onBalance: EventEmitter<any> = new EventEmitter();
  onStatus: EventEmitter<Status> = new EventEmitter<Status>();
  onFinish: EventEmitter<any> = new EventEmitter();
  onCancelled: EventEmitter<any> = new EventEmitter();
  onFailed: EventEmitter<any> = new EventEmitter();

  onVerifyTransaction: EventEmitter<any> = new EventEmitter();
  onSigned: EventEmitter<any> = new EventEmitter();
  onAccepted: EventEmitter<any> = new EventEmitter();
  onRejected: EventEmitter<any> = new EventEmitter();

  constructor(private bt: BluetoothService) {
    bcoin.set(this.network);

    this.bt.onMessage.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.messageSubject
      .filter(object => object.type === 'verifyTransaction')
      .map(object => object.content)
      .subscribe(async content => {
        return await this.startTransactionVerify(
          Transaction.fromJSON(content.transaction),
          content.address,
          content.value
        );
      });

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });
  }

  public getAddress() {
    if (this.remoteReady) {
      return this.address;
    } else {
      return null;
    }
  }

  public getBalance() {
    if (this.remoteReady) {
      return this.balance;
    } else {
      return null;
    }
  }

  public setKeyFragment(fragment) {
    try {
      this.compoundKey = new CompoundKey({
        localPrivateKeyring: fragment
      });
      this.localReady = true;
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create compound key', e);
    }
  }

  public resetRemote() {
    this.remoteReady = false;

    this.watchingWallet = null;
    this.provider = null;

    clearInterval(this.routineTimer);
    this.routineTimer = null;
  }

  public resetFull() {
    this.resetRemote();
    this.localReady = false;
    this.compoundKey = null;
  }

  public startSync() {
    if (this.syncSession && this.syncSession.status.getValue() !== Status.Finished) {
      LoggerService.log('Sync in progress', {});
      return;
    }

    let prover = null;
    try {
      prover = this.compoundKey.startInitialCommitment();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to start initial commitment', e);
    }

    this.syncSession = new SyncSession(prover, this.messageSubject, this.bt);
    this.syncSession.status.subscribe(state => this.onStatus.emit(state));
    this.syncSession.canceled.subscribe(() => {
      console.log('received cancel event');
      // pop the queue
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.syncSession = null;
      this.onCancelled.emit();
    });
    this.syncSession.failed.subscribe(() => {
      console.log('received failed event');
      // pop the queue
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.syncSession = null;
      this.onFailed.emit();
    });
    this.syncSession.finished.subscribe(async (data) => {
      console.log('received finished event');
      // pop the queue
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.syncSession = null;
      await this.finishSync(data);
    });
    // We'll handle it via events instead
    this.syncSession.sync().catch(() => {});
  }

  public cancelSync() {
    if (this.syncSession) {
      this.syncSession.cancel();
    }
  }

  async rejectTransaction() {
    if (this.signSession) {
      await this.signSession.cancel();
    }
  }

  async acceptTransaction() {
    if (this.signSession) {
      await this.signSession.submitChiphertexts();
    }
  }

  async createTransaction(address, value, substractFee) {
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

  async requestTransactionVerify(transaction, address, value) {
    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content: {
        transaction: transaction.toJSON(),
        address: address,
        value: value
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
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });
    this.signSession.failed.subscribe(async () => {
      console.log('failed');
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });
    this.signSession.signed.subscribe(async () => {
      console.log('signed');
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.onAccepted.emit();
      this.onSigned.emit();
    });

    this.signSession.sync().catch(() => {});
  }

  async startTransactionVerify(transaction, address, value) {
    this.signSession = new SignSession(
      transaction,
      this.compoundKey,
      this.messageSubject,
      this.bt
    );

    this.signSession.ready.subscribe(async () => {
      this.onVerifyTransaction.emit({
        transaction: transaction,
        address: address,
        value: value
      });
    });
    this.signSession.canceled.subscribe(async () => {
      console.log('canceled');
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });
    this.signSession.failed.subscribe(async () => {
      console.log('failed');
      this.messageSubject.next({});
      this.messageSubject.next({});
      this.signSession = null;
      this.onRejected.emit();
    });

    this.signSession.sync().catch(() => {});
  }

  async verifySignature() {
    if (this.signSession) {
      const tx = this.signSession.transaction.toTx();

      let verify;
      try {
        verify = tx.verify(await this.watchingWallet.wallet.getCoinView(tx));
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to verify signature', e);
      }
      return verify;
    }

    return false;
  }

  async pushTransaction() {
    if (this.signSession) {
      const tx = this.signSession.transaction.toTx();
      try {
        await this.provider.pushTransaction(tx.toRaw().toString('hex'));
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to push transaction', e);
      }
    }
  }

  async finishSync(data) {
    try {
      this.compoundKey.finishInitialSync(data);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed synchronization finish', e);
    }

    try {
      this.address = this.compoundKey.getCompoundKeyAddress('base58');
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
        watchingKey: this.compoundKey.compoundPublicKeyring
      }).load(this.walletDB);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create watching wallet', e);
    }

    this.watchingWallet.on('balance', (balance) => {
      this.balance = balance;
      this.onBalance.emit(this.balance);
    });

    this.watchingWallet.on('transaction', (transaction) => {
      console.log(transaction);
    });

    try {
      this.balance = await this.watchingWallet.getBalance();
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

    console.log('Sync done');

    this.onFinish.emit();

    this.remoteReady = true;
  }
}

