import { Injectable, EventEmitter } from '@angular/core';

import WalletData from '../classes/wallet-data';
import {BluetoothService} from './bluetooth.service';

declare const bcoin: any;
declare const CompoundKey: any;
declare const WatchingWallet: any;
declare const BlockCypherProvider: any;
declare const Transaction: any;
declare const Utils: any;

@Injectable()
export class WalletService {
  DDS: any = null;
  compoundKey: any = null;
  walletDB: any = null;
  watchingWallet: any = null;
  provider: any = null;

  routineTimer: any = null;

  localReady = false;
  remoteReady = false;

  address = null;
  balance = null;

  prover = null;
  verifier = null;
  signers = null;

  onBalance: EventEmitter<any> = new EventEmitter();
  onStatus: EventEmitter<any> = new EventEmitter();
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
    const prover = this.getProver();

    const initialCommitment = prover.getInitialCommitment();
    await this.bt.send(JSON.stringify({
      type: 'initialCommitment',
      content: initialCommitment
    }));

    this.onStatus.emit('Sending initialCommitment');

    this.prover = prover;
  }

  initialCommitment = async function(remoteInitialCommitment) {
    await new Promise((resolve) => {
      if (this.prover) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (this.prover) {
          clearInterval(timer);
          resolve();
        }
      }, 10);
    });

    const initialDecommitment = this.prover.processInitialCommitment(remoteInitialCommitment);
    await this.bt.send(JSON.stringify({
      type: 'initialDecommitment',
      content: initialDecommitment
    }));

    this.onStatus.emit('Sending initialDecommitment');
  };

  initialDecommitment = async function(remoteInitialDecommitment) {
    this.verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);
    await this.bt.send(JSON.stringify({
      type: 'verifierCommitment',
      content: this.verifier.getCommitment()
    }));

    this.onStatus.emit('Sending verifierCommitment');
  };

  verifierCommitment = async function(remoteVerifierCommitment) {
    const proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);
    await this.bt.send(JSON.stringify({
      type: 'proverCommitment',
      content: proverCommitment
    }));

    this.onStatus.emit('Sending proverCommitment');
  };

  proverCommitment = async function(remoteProverCommitment) {
    const verifierDecommitment = this.verifier.processCommitment(remoteProverCommitment);
    await this.bt.send(JSON.stringify({
      type: 'verifierDecommitment',
      content: verifierDecommitment
    }));

    this.onStatus.emit('Sending verifierDecommitment');
  };

  verifierDecommitment = async function(remoteVerifierDecommitment) {
    const proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);
    await this.bt.send(JSON.stringify({
      type: 'proverDecommitment',
      content: proverDecommitment
    }));

    this.onStatus.emit('Sending proverDecommitment');
  };

  proverDecommitment = function(remoteProverDecommitment) {
    const verifiedData = this.verifier.processDecommitment(remoteProverDecommitment);

    this.onStatus.emit('Fin');

    this.prover = null;
    this.verifier = null;

    this.finishSync(verifiedData).then(() => {
      this.onFinish.emit();
    });
  };

  verifyTransaction = function(obj) {
    this.onVerifyTransaction.emit({
      transaction: Transaction.fromJSON(obj.transaction),
      entropy: obj.entropy}
    );

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

    this.onStatus.emit('Sending entropyDecommitment');
  };

  entropyDecommitment = async function(entropyDecommitment) {
    Transaction.processEntropyDecommitments(this.signers, entropyDecommitment);
    const ciphertext = Transaction.computeCiphertexts(this.signers);
    await this.bt.send(JSON.stringify({
      type: 'ciphertext',
      content: ciphertext
    }));

    this.onAccepted.emit();
    this.onStatus.emit('Sending chipertext');
  };

  ciphertext = async function(ciphertext) {
    const signatures = Transaction.extractSignatures(this.signers, ciphertext).map(Utils.encodeSignature);
    this.onSigned.emit(signatures);

    this.onStatus.emit('signatures ready');
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

  async startVerify(transaction) {
    const hashes = transaction.getHashes();
    const map = transaction.mapCompoundKeys(this.compoundKey);

    this.signers = Transaction.startSign(hashes, map);
    const commitments = Transaction.createEntropyCommitments(this.signers);

    await this.bt.send(JSON.stringify({
      type: 'verifyTransaction',
      content: {
        transaction: transaction.toJSON(),
        entropy: commitments
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

    this.onStatus.emit('Sending entropyCommitment');

    console.log(this.signers, entropy);
    const entropyDecommitment = Transaction.processEntropyCommitments(this.signers, entropy);
    await this.bt.send(JSON.stringify({
      type: 'entropyDecommitment',
      content: entropyDecommitment
    }));

    this.onStatus.emit('Sending entropyDecommitment');
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

