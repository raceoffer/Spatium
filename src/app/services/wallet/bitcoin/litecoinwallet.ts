import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { NgZone } from '@angular/core';
import { ConnectivityService } from '../../connectivity.service';

import { LitecoinTransaction, LitecoinWallet as CoreLitecoinWallet } from 'crypto-core-async';

export class LitecoinWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    connectivityService: ConnectivityService,
    ngZone: NgZone
  ) {
    super(
      LitecoinTransaction,
      CoreLitecoinWallet,
      endpoint,
      network,
      keychain,
      Coin.LTC,
      account,
      connectivityService,
      ngZone);
  }

  public verifyAddress(address: string): boolean {
    return address &&
           /^[367LM][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  }
}
