import { NgZone } from '@angular/core';
import { BitcoinCashTransaction, BitcoinCashWallet as CoreBitcoinCashWallet } from 'crypto-core-async';
import { ConnectionProviderService } from '../../../connection-provider';
import { Coin, KeyChainService } from '../../../keychain.service';
import { BitcoreWallet } from './bitcorewallet';

export class BitcoinCashWallet extends BitcoreWallet {
  constructor(endpoint: string,
              network: string,
              keychain: KeyChainService,
              account: number,
              connectionProviderService: ConnectionProviderService,
              ngZone: NgZone,
              worker: any) {
    super(
      BitcoinCashTransaction,
      CoreBitcoinCashWallet,
      endpoint,
      network,
      keychain,
      Coin.BCH,
      account,
      connectionProviderService,
      ngZone,
      worker
    );
  }

  public verifyAddress(address: string): boolean {
    return address &&
      (super.verifyAddress(address) ||
        /^(bitcoincash:|bchtest:|bchreg:)[pq]([a-zA-Z0-9]{41})$/.test(address) );
  }
}
