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
declare const window: any;

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

class Failure extends Error {
  constructor(m: string, public inner: Error) {
    super(m);
  }
}

class Cancelled extends Error {
  constructor() {
    super('Cancelled');
  }
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
  }

  public cancel() {
    this.cancelObserver.next(true);
  }

  public async sync() {
    try {
      this.status.next(Status.Started);
      let initialCommitment = null;
      try {
        initialCommitment = this.prover.getInitialCommitment();
      } catch (e) {
        throw new Failure('Failed to get initialCommitment', e);
      }

      LoggerService.log('Sending initialCommitment:', initialCommitment);
      if (!await this.bt.send(JSON.stringify({
        type: 'initialCommitment',
        content: initialCommitment
      }))) {
        throw new Failure('Failed to send initialCommitment', null);
      }

      const remoteInitialCommitment = await this.initialCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
      if (!remoteInitialCommitment) {
        throw new Cancelled();
      }

      this.status.next(Status.InitialCommitment);
      LoggerService.log('Received remoteInitialCommitment', remoteInitialCommitment);
      let initialDecommitment = null;
      try {
        initialDecommitment = this.prover.processInitialCommitment(remoteInitialCommitment);
      } catch (e) {
        throw new Failure('Failed to process remoteInitialCommitment', e);
      }

      LoggerService.log('Sending initialDecommitment', initialDecommitment);
      if (!await this.bt.send(JSON.stringify({
        type: 'initialDecommitment',
        content: initialDecommitment
      }))) {
        throw new Failure('Failed to send initialDecommitment', null);
      }

      const remoteInitialDecommitment = await this.initialDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
      if (!remoteInitialDecommitment) {
        throw new Cancelled();
      }

      this.status.next(Status.InitialDecommitment);
      LoggerService.log('Received remoteInitialDecommitment', remoteInitialDecommitment);
      let verifier = null;
      try {
        verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);
      } catch (e) {
        throw new Failure('Failed to process remoteInitialDecommitment', e);
      }

      const verifierCommitment = verifier.getCommitment();

      LoggerService.log('Sending verifierCommitment', verifierCommitment);
      if (!await this.bt.send(JSON.stringify({
        type: 'verifierCommitment',
        content: verifierCommitment
      }))) {
        throw new Failure('Failed to send verifierCommitment', null);
      }

      const remoteVerifierCommitment = await this.verifierCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
      if (!remoteVerifierCommitment) {
        throw new Cancelled();
      }

      this.status.next(Status.VerifierCommitment);
      LoggerService.log('Received remoteVerifierCommitment', remoteVerifierCommitment);
      let proverCommitment = null;
      try {
        proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);
      } catch (e) {
        throw new Failure('Failed to process remoteVerifierCommitment', e);
      }

      LoggerService.log('Sending proverCommitment', proverCommitment);
      if (!await this.bt.send(JSON.stringify({
        type: 'proverCommitment',
        content: proverCommitment
      }))) {
        throw new Failure('Failed to send proverCommitment', null);
      }

      const remoteProverCommitment = await this.proverCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
      if (!remoteProverCommitment) {
        throw new Cancelled();
      }

      this.status.next(Status.ProverCommitment);
      LoggerService.log('Received remoteProverCommitment', remoteProverCommitment);
      let verifierDecommitment = null;
      try {
        verifierDecommitment = verifier.processCommitment(remoteProverCommitment);
      } catch (e) {
        throw new Failure('Failed to process remoteProverCommitment', e);
      }

      LoggerService.log('Sending verifierDecommitment', verifierDecommitment);
      if (!await this.bt.send(JSON.stringify({
        type: 'verifierDecommitment',
        content: verifierDecommitment
      }))) {
        throw new Failure('Failed to send verifierDecommitment', null);
      }

      const remoteVerifierDecommitment = await this.verifierDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
      if (!remoteVerifierDecommitment) {
        throw new Cancelled();
      }

      this.status.next(Status.VerifierDecommitment);
      LoggerService.log('Received remoteVerifierDecommitment', remoteVerifierDecommitment);
      let proverDecommitment = null;
      try {
        proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);
      } catch (e) {
        throw new Failure('Failed to process remoteVerifierDecommitment', e);
      }

      LoggerService.log('Sending proverDecommitment', proverDecommitment);
      if (!await this.bt.send(JSON.stringify({
        type: 'proverDecommitment',
        content: proverDecommitment
      }))) {
        throw new Failure('Failed to send proverDecommitment', null);
      }

      const remoteProverDecommitment = await this.proverDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
      if (!remoteProverDecommitment) {
        throw new Cancelled();
      }

      this.status.next(Status.ProverDecommitment);
      LoggerService.log('Received remoteProverDecommitment', remoteProverDecommitment);
      let verifiedData = null;
      try {
        verifiedData = verifier.processDecommitment(remoteProverDecommitment);
      } catch (e) {
        throw new Failure('Failed to process remoteProverDecommitment', e);
      }

      this.finished.emit(verifiedData);

      return verifiedData;
    } catch (e) {
      if (e instanceof Failure) {
        LoggerService.nonFatalCrash(e.message, e.inner);
        this.failed.emit();
      } else if (e instanceof Cancelled) {
        LoggerService.log('Cancelled', {});
        this.canceled.emit();
      }
    } finally {
      this.status.next(Status.Finished);
    }
  }
}

class SignSession {
  constructor() {

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

  signers = null;

  network = 'testnet'; // 'main'; | 'testnet';

  onBalance: EventEmitter<any> = new EventEmitter();
  onStatus: EventEmitter<Status> = new EventEmitter<Status>();
  onFinish: EventEmitter<any> = new EventEmitter();
  onCancelled: EventEmitter<any> = new EventEmitter();
  onFailed: EventEmitter<any> = new EventEmitter();

  onSigned: EventEmitter<any> = new EventEmitter();
  onVerifyTransaction: EventEmitter<any> = new EventEmitter();
  onAccepted: EventEmitter<any> = new EventEmitter();
  onRejected: EventEmitter<any> = new EventEmitter();

  constructor(private bt: BluetoothService) {
    bcoin.set(this.network);

    this.bt.onMessage.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
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
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to create compound key');
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
      throw new Error('Sync in progress');
    }

    let prover = null;
    try {
      prover = this.compoundKey.startInitialCommitment();
    } catch (e) {
      window.fabric.Crashlytics.addLog('Failed to start initial commitment', e);
    }

    this.syncSession = new SyncSession(prover, this.messageSubject, this.bt);
    this.syncSession.status.subscribe(state => this.onStatus.emit(state));
    this.syncSession.canceled.subscribe(() => {
      this.syncSession = null;
      this.onCancelled.emit();
    });
    this.syncSession.failed.subscribe(() => {
      this.syncSession = null;
      this.onFailed.emit();
    });
    this.syncSession.finished.subscribe(() => {
      this.syncSession = null;
    });
    this.syncSession.sync().then(data => this.finishSync(data));
  }

  public cancelSync() {
    if (this.syncSession) {
      this.syncSession.cancel();
    }
  }

  verifyTransaction = function(obj) {
    this.onVerifyTransaction.emit({
      transaction: Transaction.fromJSON(obj.transaction),
      entropy: obj.entropy,
      address: obj.address,
      value: obj.value
    });

    this.onStatus.emit('Received tx');
  };

  transactionReject = function() {
    this.onRejected.emit();
  };

  async reject() {
    await this.bt.send(JSON.stringify({
      type: 'transactionReject',
      content: null
    }));
  }

  entropyCommitment = async function(entropyCommitment) {
    let entropyDecommitment = null;
    try {
      entropyDecommitment = Transaction.processEntropyCommitments(this.signers, entropyCommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.addLog(JSON.stringify(entropyCommitment));
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process entropy commitment');
    }

    await this.bt.send(JSON.stringify({
      type: 'entropyDecommitment',
      content: entropyDecommitment
    }));
  };

  entropyDecommitment = async function(entropyDecommitment) {
    try {
      Transaction.processEntropyDecommitments(this.signers, entropyDecommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.addLog(JSON.stringify(entropyDecommitment));
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process entropy decommitment');
    }

    let ciphertext = null;
    try {
      ciphertext = Transaction.computeCiphertexts(this.signers);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to compute ciphertext');
    }

    await this.bt.send(JSON.stringify({
      type: 'ciphertext',
      content: ciphertext
    }));

    this.onAccepted.emit();
  };

  ciphertext = async function(ciphertext) {
    let signatures = null;
    try {
      signatures = Transaction.extractSignatures(this.signers, ciphertext).map(Utils.encodeSignature);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.addLog(JSON.stringify(ciphertext));
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to extract signatures');
    }

    this.onSigned.emit(signatures);
  };

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
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to prepare transaction');
    }

    return transaction;
  }

  async startVerify(transaction, address, value) {
    let hashes = null;
    try {
      hashes = transaction.getHashes();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get transaction hashes');
    }

    let map = null;
    try {
      map = transaction.mapCompoundKeys(this.compoundKey);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get transaction map compound key');
    }

    this.signers = Transaction.startSign(hashes, map);

    let commitments = null;
    try {
      commitments = Transaction.createEntropyCommitments(this.signers);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to create entropy commitments');
    }

    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content: {
        transaction: transaction.toJSON(),
        entropy: commitments,
        address: address,
        value: value
      }
    }));
  }

  async accept(transaction, entropy) {
    let hashes;
    try {
      hashes = transaction.getHashes();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get transaction hashes');
    }

    let map;
    try {
      map = transaction.mapCompoundKeys(this.compoundKey);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get transaction map compound key');
    }

    this.signers = Transaction.startSign(hashes, map);
    let commitments;
    try {
      commitments = Transaction.createEntropyCommitments(this.signers);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to create entropy commitments');
    }

    await this.bt.send(JSON.stringify({
      type: 'entropyCommitment',
      content: commitments
    }));

    console.log(this.signers, entropy);

    let entropyDecommitment = null;
    try {
      entropyDecommitment = Transaction.processEntropyCommitments(this.signers, entropy);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.addLog(JSON.stringify(entropy));
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process entropy commitments');
    }

    await this.bt.send(JSON.stringify({
      type: 'entropyDecommitment',
      content: entropyDecommitment
    }));
  }

  async verifySignature(transaction) {
    const tx = transaction.toTX();

    let verify;
    try {
      verify = tx.verify(await this.watchingWallet.wallet.getCoinView(tx));
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to verify signature');
  }
    return verify;
  }

  async pushTransaction(transaction) {
    const tx = transaction.toTX();
    try {
      await this.provider.pushTransaction(tx.toRaw().toString('hex'));
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to push transaction');
    }
  }

  async finishSync(data) {
    try {
      this.compoundKey.finishInitialSync(data);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed synchronization finish');
    }

    try {
      this.address = this.compoundKey.getCompoundKeyAddress('base58');
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get compound key address');
    }

    try {
      await this.walletDB.open();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed open database');
    }

    try {
      this.watchingWallet = await new WatchingWallet({
        watchingKey: this.compoundKey.compoundPublicKeyring
      }).load(this.walletDB);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to create watching wallet');
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
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get the balance');
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
      this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(e => {});
      clearInterval(this.routineTimer);
      this.routineTimer = setInterval(() => {
        this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(e => {});
      }, 20000);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to pull transactions into provider');
    }

    // End: configuring a provider

    console.log('Sync done');

    this.onFinish.emit();

    this.remoteReady = true;
  }
}

