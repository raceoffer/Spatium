import { NgZone } from '@angular/core';
import { BitcoinTransaction, BitcoinWallet as CoreBitcoinWallet } from 'crypto-core-async';
import { ConnectionProviderService } from '../../../connection-provider';
import { Coin, KeyChainService } from '../../../keychain.service';
import { BitcoreWallet } from './bitcorewallet';

export class BitcoinWallet extends BitcoreWallet {
  constructor(endpoint: string,
              network: string,
              keychain: KeyChainService,
              account: number,
              connectionProviderService: ConnectionProviderService,
              ngZone: NgZone,
              worker: any) {
    super(
      BitcoinTransaction,
      CoreBitcoinWallet,
      endpoint,
      network,
      keychain,
      network === 'main' ? Coin.BTC : Coin.BTC_test,
      account,
      connectionProviderService,
      ngZone,
      worker
    );
  }
}
