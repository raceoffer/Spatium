import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

import { BitcoinTransaction, BitcoinWallet as CoreBitcoinWallet } from 'crypto-core-async';

export class BitcoinWallet extends BitcoreWallet {
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
      BitcoinTransaction,
      CoreBitcoinWallet,
      endpoint,
      network,
      keychain,
      network === 'main' ? Coin.BTC : Coin.BTC_test,
      account,
      messageSubject,
      bt,
      ngZone,
      worker
    );
  }
}
