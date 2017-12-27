import { Injectable } from '@angular/core';

import WalletData from '../classes/wallet-data';
import {BluetoothService} from './bluetooth.service';

declare const bcoin: any;
declare const CompoundKey: any;
declare const WatchingWallet: any;

@Injectable()
export class WalletService {
  DDS: any = null;
  compoundKey: any = null;
  walletDB: any = null;

  watchingWallet: any = null;

  localReady = false;
  remoteReady = false;

  address = null;
  balance = null;

  prover = null;
  verifier = null;

  onStatus = null;
  onFinish = null;

  constructor(private bt: BluetoothService) {
    this.bt.onMessage.subscribe((message) => {
      const obj = JSON.parse(message);
      this[obj.type](obj.content);
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

    if (this.onStatus) {
      this.onStatus('Sending initialCommitment');
    }

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

    if (this.onStatus) {
      this.onStatus('Sending initialDecommitment');
    }
  };

  initialDecommitment = function(remoteInitialDecommitment) {
    this.verifier = this.prover.processInitialDecommitment(remoteInitialDecommitment);
    this.bt.send(JSON.stringify({
      type: 'verifierCommitment',
      content: this.verifier.getCommitment()
    }));

    if (this.onStatus) {
      this.onStatus('Sending verifierCommitment');
    }
  };

  verifierCommitment = function(remoteVerifierCommitment) {
    const proverCommitment = this.prover.processCommitment(remoteVerifierCommitment);
    this.bt.send(JSON.stringify({
      type: 'proverCommitment',
      content: proverCommitment
    }));

    if (this.onStatus) {
      this.onStatus('Sending proverCommitment');
    }
  };

  proverCommitment = function(remoteProverCommitment) {
    const verifierDecommitment = this.verifier.processCommitment(remoteProverCommitment);
    this.bt.send(JSON.stringify({
      type: 'verifierDecommitment',
      content: verifierDecommitment
    }));

    if (this.onStatus) {
      this.onStatus('Sending verifierDecommitment');
    }
  };

  verifierDecommitment = function(remoteVerifierDecommitment) {
    const proverDecommitment = this.prover.processDecommitment(remoteVerifierDecommitment);
    this.bt.send(JSON.stringify({
      type: 'proverDecommitment',
      content: proverDecommitment
    }));

    if (this.onStatus) {
      this.onStatus('Sending proverDecommitment');
    }
  };

  proverDecommitment = function(remoteProverDecommitment) {
    const verifiedData = this.verifier.processDecommitment(remoteProverDecommitment);

    if (this.onStatus) {
      this.onStatus('Fin');
    }

    this.prover = null;
    this.verifier = null;

    this.finishSync(verifiedData).then(() => {
      if (this.onFinish) {
        this.onFinish();
      }
    });
  };

  async finishSync(data) {
    this.compoundKey.finishInitialSync(data);

    this.address = this.compoundKey.getCompoundKeyAddress('base58');

    this.walletDB = new bcoin.walletdb({
      db: 'memory',
      location: 'test'
    });

    await this.walletDB.open();

    this.watchingWallet = await new WatchingWallet({
      watchingKey: this.compoundKey.compoundPublicKeyring
    }).load(this.walletDB);

    this.watchingWallet.on('balance', (balance) => {
      this.balance = balance;
      // console.log('Balance:', bcoin.amount.btc(balance.confirmed), '(', bcoin.amount.btc(balance.unconfirmed), ')');
    });

    this.balance = await this.watchingWallet.getBalance();

    this.remoteReady = true;
  }
}

