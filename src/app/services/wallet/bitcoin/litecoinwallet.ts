import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

import { LitecoinTransaction, LitecoinWallet as CoreLitecoinWallet } from 'crypto-core-async';

export class LitecoinWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone,
    worker: any
  ) {
    super(
      LitecoinTransaction,
      CoreLitecoinWallet,
      endpoint,
      network,
      keychain,
      Coin.LTC,
      account,
      messageSubject,
      bt,
      ngZone,
      worker
    );
  }

  // public verifyAddress(address: string): boolean {
  //   return address &&
  //          /^[367LM][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  // }
}
