import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { NgZone } from '@angular/core';
import { ConnectivityService } from '../../connectivity.service';

import { BitcoinCashTransaction, BitcoinCashWallet as CoreBitcoinCashWallet } from 'crypto-core-async';

export class BitcoinCashWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    connectivityService: ConnectivityService,
    ngZone: NgZone
  ) {
    super(
      BitcoinCashTransaction,
      CoreBitcoinCashWallet,
      endpoint,
      network,
      keychain,
      Coin.BCH,
      account,
      connectivityService,
      ngZone);
  }

  public verifyAddress(address: string): boolean {
    return address &&
           (super.verifyAddress(address) ||
            /^(bitcoincash:|bchtest:|bchreg:)[pq]([a-zA-Z0-9]{41})$/.test(address) );
  }
}
