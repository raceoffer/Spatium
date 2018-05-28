import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { NgZone } from '@angular/core';
import { ConnectivityService } from '../../connectivity.service';

import { BitcoinTransaction, BitcoinWallet as CoreBitcoinWallet } from 'crypto-core-async';

export class BitcoinWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    connectivityService: ConnectivityService,
    ngZone: NgZone
  ) {
    super(
      BitcoinTransaction,
      CoreBitcoinWallet,
      endpoint,
      network,
      keychain,
      network === 'main' ? Coin.BTC : Coin.BTC_test,
      account,
      connectivityService,
      ngZone);
  }
}
