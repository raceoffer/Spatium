import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { NgZone } from '@angular/core';
import { ConnectivityService } from '../../connectivity.service';

declare const CryptoCore: any;

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
      CryptoCore.BitcoinTransaction,
      CryptoCore.BitcoinWallet,
      endpoint,
      network,
      keychain,
      network === 'main' ? Coin.BTC : Coin.BTC_test,
      account,
      connectivityService,
      ngZone);
  }
}
