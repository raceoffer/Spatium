import { Injectable, EventEmitter } from '@angular/core';

import WalletData from '../classes/wallet-data';
import {BluetoothService} from './bluetooth.service';

declare const bcoin: any;
declare const CompoundKey: any;
declare const WatchingWallet: any;
declare const BlockCypherProvider: any;
declare const Transaction: any;
declare const Utils: any;

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

  onBalance: EventEmitter<any> = new EventEmitter();
  onStatus: EventEmitter<Status> = new EventEmitter<Status>();
  onFinish: EventEmitter<any> = new EventEmitter();

  onSigned: EventEmitter<any> = new EventEmitter();
  onVerifyTransaction: EventEmitter<any> = new EventEmitter();
  onAccepted: EventEmitter<any> = new EventEmitter();
  onRejected: EventEmitter<any> = new EventEmitter();

  constructor(private bt: BluetoothService) {
    bcoin.set('testnet');

    this.bt.onMessage.subscribe((message) => {
      const obj = JSON.parse(message);
      this[obj.type](obj.content);
    });

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });
  }

  generateFragment() {
    return CompoundKey.generateKeyring();
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
    this.compoundKey = new CompoundKey({
      localPrivateKeyring: fragment
    });
    this.localReady = true;
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
    return this.compoundKey.startInitialCommitment();
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

    const initialCommitment = prover.getInitialCommitment();

    console.log('Sending initialCommitment');
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

    console.log('Received remoteInitialCommitment');
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

    const initialDecommitment = this.prover.processInitialCommitment(remoteInitialCommitment);

    console.log('Sending initialDecommitment');
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

    console.log('Received remoteInitialDecommitment');
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

    this.verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);

    console.log('Sending verifierCommitment');
    await this.bt.send(JSON.stringify({
      type: 'verifierCommitment',
      content: this.verifier.getCommitment()
    }));

    this.onStatus.emit(Status.VerifierCommitment);

    this.readyInitialDecommitment = true;
  };

  verifierCommitment = async function(remoteVerifierCommitment) {
    if (this.readyVerifierCommitment) {
      return;
    }

    console.log('Received remoteVerifierCommitment');
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

    const proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);

    console.log('Sending proverCommitment');
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

    console.log('Received remoteProverCommitment');
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

    const verifierDecommitment = this.verifier.processCommitment(remoteProverCommitment);

    console.log('Sending verifierDecommitment');
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

    console.log('Received remoteVerifierDecommitment');
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

    const proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);

    console.log('Sending proverDecommitment');
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

    console.log('Received remoteProverDecommitment');
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

    const verifiedData = this.verifier.processDecommitment(remoteProverDecommitment);

    console.log('Done sync');

    this.onStatus.emit(Status.Finish);

    this.prover = null;
    this.verifier = null;

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
    const entropyDecommitment = Transaction.processEntropyCommitments(this.signers, entropyCommitment);
    await this.bt.send(JSON.stringify({
      type: 'entropyDecommitment',
      content: entropyDecommitment
    }));
  };

  entropyDecommitment = async function(entropyDecommitment) {
    Transaction.processEntropyDecommitments(this.signers, entropyDecommitment);
    const ciphertext = Transaction.computeCiphertexts(this.signers);
    await this.bt.send(JSON.stringify({
      type: 'ciphertext',
      content: ciphertext
    }));

    this.onAccepted.emit();
  };

  ciphertext = async function(ciphertext) {
    const signatures = Transaction.extractSignatures(this.signers, ciphertext).map(Utils.encodeSignature);
    this.onSigned.emit(signatures);
  };

  async createTransaction(address, value, substractFee) {
    const transaction = new Transaction({
      address: address,
      value: value
    });

    /// Fill inputs and calculate script hashes
    await transaction.prepare(this.watchingWallet, {
      subtractFee: substractFee
    });

    return transaction;
  }

  async startVerify(transaction, address, value) {
    const hashes = transaction.getHashes();
    const map = transaction.mapCompoundKeys(this.compoundKey);

    this.signers = Transaction.startSign(hashes, map);
    const commitments = Transaction.createEntropyCommitments(this.signers);

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
    const hashes = transaction.getHashes();
    const map = transaction.mapCompoundKeys(this.compoundKey);

    this.signers = Transaction.startSign(hashes, map);
    const commitments = Transaction.createEntropyCommitments(this.signers);

    await this.bt.send(JSON.stringify({
      type: 'entropyCommitment',
      content: commitments
    }));

    console.log(this.signers, entropy);
    const entropyDecommitment = Transaction.processEntropyCommitments(this.signers, entropy);
    await this.bt.send(JSON.stringify({
      type: 'entropyDecommitment',
      content: entropyDecommitment
    }));
  }

  async verifySignature(transaction) {
    const tx = transaction.toTX();

   return tx.verify(await this.watchingWallet.wallet.getCoinView(tx));
  }

  async pushTransaction(transaction) {
    const tx = transaction.toTX();
    await this.provider.pushTransaction(tx.toRaw().toString('hex'));
  }

  async finishSync(data) {
    this.compoundKey.finishInitialSync(data);
    this.address = this.compoundKey.getCompoundKeyAddress('base58');

    try {
      await this.walletDB.open();
    } catch (e) {}
    this.watchingWallet = await new WatchingWallet({
      watchingKey: this.compoundKey.compoundPublicKeyring
    }).load(this.walletDB);

    this.watchingWallet.on('balance', (balance) => {
      this.balance = balance;
      this.onBalance.emit(this.balance);
    });

    this.watchingWallet.on('transaction', (transaction) => {
      console.log(transaction);
    });

    this.balance = await this.watchingWallet.getBalance();

    // Start: configuring a provider
    this.provider = new BlockCypherProvider();

    this.provider.on('rawTransaction', async (hex, meta) => {
      await this.watchingWallet.addRawTransaction(hex, meta);
    });

    // Initiate update routine

    this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(e => {});
    clearInterval(this.routineTimer);
    this.routineTimer = setInterval(() => {
      this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(e => {});
    }, 20000);

    // End: configuring a provider

    console.log('Sync done');

    this.remoteReady = true;
  }
}

