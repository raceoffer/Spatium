import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

import { BitcoinCashTransaction, BitcoinCashWallet as CoreBitcoinCashWallet } from 'crypto-core-async';

export class BitcoinCashWallet extends BitcoreWallet {
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
      BitcoinCashTransaction,
      CoreBitcoinCashWallet,
      endpoint,
      network,
      keychain,
      Coin.BCH,
      account,
      messageSubject,
      bt,
      ngZone,
      worker
    );
  }
}
