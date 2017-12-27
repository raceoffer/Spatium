import { Injectable, EventEmitter } from '@angular/core';

import WalletData from '../classes/wallet-data';
import {BluetoothService} from './bluetooth.service';

declare const bcoin: any;
declare const CompoundKey: any;
declare const WatchingWallet: any;
declare const BlockCypherProvider: any;

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

  onStatus: EventEmitter<any> = new EventEmitter();
  onFinish: EventEmitter<any> = new EventEmitter();

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

  startSync() {
    const prover = this.getProver();

    const initialCommitment = prover.getInitialCommitment();
    this.bt.send(JSON.stringify({
      type: 'initialCommitment',
      content: initialCommitment
    }));

    this.onStatus.emit('Sending initialCommitment');

    this.prover = prover;
  }

  initialCommitment = async function(remoteInitialCommitment) {
    await new Promise((resolve, reject) => {
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
    this.bt.send(JSON.stringify({
      type: 'initialDecommitment',
      content: initialDecommitment
    }));

    this.onStatus.emit('Sending initialDecommitment');
  };

  initialDecommitment = function(remoteInitialDecommitment) {
    this.verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);
    this.bt.send(JSON.stringify({
      type: 'verifierCommitment',
      content: this.verifier.getCommitment()
    }));

    this.onStatus.emit('Sending verifierCommitment');
  };

  verifierCommitment = function(remoteVerifierCommitment) {
    const proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);
    this.bt.send(JSON.stringify({
      type: 'proverCommitment',
      content: proverCommitment
    }));

    this.onStatus.emit('Sending proverCommitment');
  };

  proverCommitment = function(remoteProverCommitment) {
    const verifierDecommitment = this.verifier.processCommitment(remoteProverCommitment);
    this.bt.send(JSON.stringify({
      type: 'verifierDecommitment',
      content: verifierDecommitment
    }));

    this.onStatus.emit('Sending verifierDecommitment');
  };

  verifierDecommitment = function(remoteVerifierDecommitment) {
    const proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);
    this.bt.send(JSON.stringify({
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

    try {
      await this.provider.pullTransactions(this.watchingWallet.getAddress('base58'));
    } catch (e) {}
    clearInterval(this.routineTimer);
    this.routineTimer = setInterval(async () => {
      try {
        await this.provider.pullTransactions(this.watchingWallet.wallet.getAddress('base58'));
      } catch (e) {}
    }, 20000);

    // End: configuring a provider

    console.log('Sync done');

    this.remoteReady = true;
  }
}

