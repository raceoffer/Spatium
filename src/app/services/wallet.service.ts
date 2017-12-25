import { Injectable } from '@angular/core';

import {Signature} from '../cryptocurrency/signature';
import WalletData from '../classes/wallet-data';
import {Wallet} from '../cryptocurrency/wallet';

declare var bcoin: any;
declare var CompoundKey: any;
declare var WatchingWallet: any;

@Injectable()
export class WalletService {
  connected = false;
  initiatorDDS: any;
  initiatorCompoundKey: any;
  verifierDDS: any;
  verifierCompoundKey: any;

  constructor() {
    // this.emulateConnection();
  }

  async getAddress(): Promise<string> {
    return await this.initiatorCompoundKey.getCompoundKeyAddress('base58');
  }

  async getBalance(): Promise<any> {
    return await this.initiatorDDS.getBalance();
  }

  async getWallet(): Promise<WalletData> {
    const wallet = new WalletData();
    wallet.address = await this.getAddress();
    wallet.balance = await this.getBalance();
    return wallet;
  }

  async emulateConnection() {
    if (this.connected) return;

    const initiatorDDS = await Signature.getDDS();
    console.log("Initiator", initiatorDDS.address, Signature.web3.utils.fromWei(
      await initiatorDDS.getBalance(),"ether"),"eth");
    this.initiatorDDS = initiatorDDS;

    const verifierDDS = await Signature.getDDS();
    console.log("Verifier", verifierDDS.address, Signature.web3.utils.fromWei(
      await verifierDDS.getBalance(),"ether"),"eth");
    this.verifierDDS = verifierDDS;

    const initiatorKey = await Signature.getKeyring(initiatorDDS);
    const verifierKey = await Signature.getKeyring(verifierDDS);

    const initiator = new CompoundKey({
      localPrivateKeyring: initiatorKey
    });
    this.initiatorCompoundKey = initiator;

    const verifier = new CompoundKey({
      localPrivateKeyring: verifierKey
    });
    this.verifierCompoundKey = verifier;

    //!--- Secret sharing with Pedersen commitment scheme and original proof of paillier encryption

    const initiatorProver = initiator.startInitialCommitment();
    const verifierProver = verifier.startInitialCommitment();

    // Step 1: creating commitments
    const initiatorCommitment = JSON.stringify(initiatorProver.getInitialCommitment());
    const verifierCommitment = JSON.stringify(verifierProver.getInitialCommitment());

    // Step 3: exchanging decommitments (a party sends its decommitment only after it has received other party's commitment)
    const initiatorDecommitment = JSON.stringify(initiatorProver.processInitialCommitment(JSON.parse(verifierCommitment)));
    const verifierDecommitment = JSON.stringify(verifierProver.processInitialCommitment(JSON.parse(initiatorCommitment)));

    // Step 4: decommiting
    const verifierVerifier = verifierProver.processInitialDecommitment(JSON.parse(initiatorDecommitment));
    const initiatorVerifier = initiatorProver.processInitialDecommitment(JSON.parse(verifierDecommitment));

    // Further steps: interactive proofs of knowledge
    const verifierVerifierCommitment = JSON.stringify(verifierVerifier.getCommitment());
    const initiatorProverCommitment = JSON.stringify(initiatorProver.processCommitment(JSON.parse(verifierVerifierCommitment)));
    const verifierVerifierDecommitment = JSON.stringify(verifierVerifier.processCommitment(JSON.parse(initiatorProverCommitment)));
    const initiatorProverDecommitment = JSON.stringify(initiatorProver.processDecommitment(JSON.parse(verifierVerifierDecommitment)));
    const verifierVerifiedData = verifierVerifier.processDecommitment(JSON.parse(initiatorProverDecommitment));
    verifier.finishInitialSync(verifierVerifiedData);

    const initiatorVerifierCommitment = JSON.stringify(initiatorVerifier.getCommitment());
    const verifierProverCommitment = JSON.stringify(verifierProver.processCommitment(JSON.parse(initiatorVerifierCommitment)));
    const initiatorVerifierDecommitment = JSON.stringify(initiatorVerifier.processCommitment(JSON.parse(verifierProverCommitment)));
    const verifierProverDecommitment = JSON.stringify(verifierProver.processDecommitment(JSON.parse(initiatorVerifierDecommitment)));
    const initiatorVerifiedData = initiatorVerifier.processDecommitment(JSON.parse(verifierProverDecommitment));
    initiator.finishInitialSync(initiatorVerifiedData);

    //!--- End sharing

    console.log(initiator.getCompoundKeyAddress('base58'));

    // Start: configuring a wallet

    await Wallet.walletdb.open();

    // The wallet is intended to watch over the full public key
    const wallet = await new WatchingWallet({
      watchingKey: initiator.compoundPublicKeyring
    }).load(Wallet.walletdb);

    wallet.on('balance', (balance) => {
      console.log('Balance:', bcoin.amount.btc(balance.confirmed), '(', bcoin.amount.btc(balance.unconfirmed), ')');
    });

    // End: configuring a wallet

    // Displaying an initial (loaded from db) balance
    const balance = await wallet.getBalance();
    console.log('Balance:', bcoin.amount.btc(balance.confirmed), '(', bcoin.amount.btc(balance.unconfirmed), ')');

    // this.router.navigate(['/', 'wallet']);
    this.connected = true;
  }

}
