import { Injectable, EventEmitter } from '@angular/core';
import { UUID } from 'angular2-uuid';

import WalletData from '../classes/wallet-data';
import {BluetoothService} from './bluetooth.service';

declare const bcoin: any;
declare const CompoundKey: any;
declare const WatchingWallet: any;
declare const BlockchainInfoProvider: any;
declare const Transaction: any;
declare const Utils: any;
declare const window: any;

enum Status {
  Start = 0,
  InitialCommitment,
  InitialDecommitment,
  VerifierCommitment,
  ProverCommitment,
  VerifierDecommitment,
  ProverDecommitment,
  Finish
}

@Injectable()
export class WalletService {
  DDS: any = null;
  compoundKey: any = null;
  walletDB: any = null;
  watchingWallet: any = null;
  provider: any = null;

  readyStart = false;
  readyInitialCommitment = false;
  readyInitialDecommitment = false;
  readyVerifierCommitment = false;
  readyProverCommitment = false;
  readyVerifierDecommitment = false;
  readyProverDecommitment = false;

  routineTimer: any = null;

  localReady = false;
  remoteReady = false;

  address = null;
  balance = null;

  prover = null;
  verifier = null;
  signers = null;

  network = 'testnet'; // 'main'; | 'testnet';

  onBalance: EventEmitter<any> = new EventEmitter();
  onStatus: EventEmitter<Status> = new EventEmitter<Status>();
  onFinish: EventEmitter<any> = new EventEmitter();

  onSigned: EventEmitter<any> = new EventEmitter();
  onVerifyTransaction: EventEmitter<any> = new EventEmitter();
  onAccepted: EventEmitter<any> = new EventEmitter();
  onRejected: EventEmitter<any> = new EventEmitter();

  private static log(message, data) {
    window.fabric.Crashlytics.addLog(message + JSON.stringify(data));
    console.log(message, JSON.stringify(data));
  }

  constructor(private bt: BluetoothService) {
    bcoin.set(this.network);

    this.bt.onMessage.subscribe((message) => {
      const obj = JSON.parse(message);
      this[obj.type](obj.content);
    });

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });
  }

  generateFragment() {
    let key = null;
    try {
      key = CompoundKey.generateKeyring();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to generate key fragment');
    } finally {
      return key;
    }
  }

  getAddress() {
    if (this.remoteReady) {
      return this.address;
    } else {
      return null;
    }
  }

  getBalance() {
    if (this.remoteReady) {
      return this.balance;
    } else {
      return null;
    }
  }

  getWallet() {
    const wallet = new WalletData();
    wallet.address = this.getAddress();
    wallet.balance = this.getBalance();
    return wallet;
  }

  setKeyFragment(fragment) {
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

  resetRemote() {
    this.remoteReady = false;
    this.prover = null;
    this.verifier = null;

    this.watchingWallet = null;
    this.provider = null;

    clearInterval(this.routineTimer);
    this.routineTimer = null;
  }

  resetFull() {
    this.resetRemote();
    this.localReady = false;
    this.compoundKey = null;
  }

  getProver() {
    try {
      return this.compoundKey.startInitialCommitment();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to start initial commitment');
    }
  }

  async startSync() {
    this.onStatus.emit(Status.Start);

    this.readyStart = false;
    this.readyInitialCommitment = false;
    this.readyInitialDecommitment = false;
    this.readyVerifierCommitment = false;
    this.readyProverCommitment = false;
    this.readyVerifierDecommitment = false;
    this.readyProverDecommitment = false;

    const prover = this.getProver();

    let initialCommitment = null;
    try {
      initialCommitment = prover.getInitialCommitment();
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to get initial commitment');
    }

    WalletService.log('Sending initialCommitment:', initialCommitment);
    await this.bt.send(JSON.stringify({
      type: 'initialCommitment',
      content: initialCommitment
    }));

    this.onStatus.emit(Status.InitialCommitment);

    this.prover = prover;

    this.readyStart = true;
  }

  initialCommitment = async function(remoteInitialCommitment) {
    if (this.readyInitialCommitment) {
      return;
    }

    WalletService.log('Received remoteInitialCommitment', remoteInitialCommitment);
    await new Promise((resolve) => {
      if (this.readyStart) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.readyStart) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    let initialDecommitment = null;
    try {
      initialDecommitment = this.prover.processInitialCommitment(remoteInitialCommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process initial commitment');
    }

    WalletService.log('Sending initialDecommitment', initialDecommitment);
    await this.bt.send(JSON.stringify({
      type: 'initialDecommitment',
      content: initialDecommitment
    }));

    this.onStatus.emit(Status.InitialDecommitment);

    this.readyInitialCommitment = true;
  };

  initialDecommitment = async function(remoteInitialDecommitment) {
    if (this.readyInitialDecommitment) {
      return;
    }

    WalletService.log('Received remoteInitialDecommitment', remoteInitialDecommitment);
    await new Promise((resolve) => {
      if (this.readyInitialCommitment) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.readyInitialCommitment) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    try {
      this.verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process initial decommitment');
    }

    const verifierCommitment = this.verifier.getCommitment();

    WalletService.log('Sending verifierCommitment', verifierCommitment);
    await this.bt.send(JSON.stringify({
      type: 'verifierCommitment',
      content: verifierCommitment
    }));

    this.onStatus.emit(Status.VerifierCommitment);

    this.readyInitialDecommitment = true;
  };

  verifierCommitment = async function(remoteVerifierCommitment) {
    if (this.readyVerifierCommitment) {
      return;
    }

    WalletService.log('Received remoteVerifierCommitment', remoteVerifierCommitment);
    await new Promise((resolve) => {
      if (this.readyInitialDecommitment) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.readyInitialDecommitment) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    let proverCommitment = null;
    try {
      proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process verifier commitment');
    }

    WalletService.log('Sending proverCommitment', proverCommitment);
    await this.bt.send(JSON.stringify({
      type: 'proverCommitment',
      content: proverCommitment
    }));

    this.onStatus.emit(Status.ProverCommitment);

    this.readyVerifierCommitment = true;
  };

  proverCommitment = async function(remoteProverCommitment) {
    if (this.readyProverCommitment) {
      return;
    }

    WalletService.log('Received remoteProverCommitment', remoteProverCommitment);
    await new Promise((resolve) => {
      if (this.readyVerifierCommitment) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.readyVerifierCommitment) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    let verifierDecommitment = null;
    try {
      verifierDecommitment = this.verifier.processCommitment(remoteProverCommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process prover commitment');
    }

    WalletService.log('Sending verifierDecommitment', verifierDecommitment);
    await this.bt.send(JSON.stringify({
      type: 'verifierDecommitment',
      content: verifierDecommitment
    }));

    this.onStatus.emit(Status.VerifierDecommitment);

    this.readyProverCommitment = true;
  };

  verifierDecommitment = async function(remoteVerifierDecommitment) {
    if (this.readyVerifierDecommitment) {
      return;
    }

    WalletService.log('Received remoteVerifierDecommitment', remoteVerifierDecommitment);
    await new Promise((resolve) => {
      if (this.readyProverCommitment) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.readyProverCommitment) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    let proverDecommitment = null;
    try {
      proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process verifier decommitment');
    }

    WalletService.log('Sending proverDecommitment', proverDecommitment);
    await this.bt.send(JSON.stringify({
      type: 'proverDecommitment',
      content: proverDecommitment
    }));

    this.onStatus.emit(Status.ProverDecommitment);

    this.readyVerifierDecommitment = true;
  };

  proverDecommitment = async function(remoteProverDecommitment) {
    if (this.readyProverDecommitment) {
      return;
    }

    WalletService.log('Received remoteProverDecommitment', remoteProverDecommitment);
    await new Promise((resolve) => {
      if (this.readyProverCommitment) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.readyProverCommitment) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });

    let verifiedData = null;
    try {
      verifiedData = this.verifier.processDecommitment(remoteProverDecommitment);
    } catch (e) {
      window.fabric.Crashlytics.addLog(e);
      window.fabric.Crashlytics.sendNonFatalCrash('Failed to process prover decommitment');
    }

    this.readyStart = false;
    this.readyInitialCommitment = false;
    this.readyInitialDecommitment = false;
    this.readyVerifierCommitment = false;
    this.readyProverCommitment = false;
    this.readyVerifierDecommitment = false;
    this.readyProverDecommitment = false;

    this.prover = null;
    this.verifier = null;

    console.log('Done sync');

    this.onStatus.emit(Status.Finish);

    this.readyProverDecommitment = true;

    this.finishSync(verifiedData).then(() => {
      this.onFinish.emit();
    });
  };

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

    this.remoteReady = true;
  }
}

