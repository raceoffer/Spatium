import { NgZone } from '@angular/core';
import { LitecoinTransaction, LitecoinWallet as CoreLitecoinWallet } from 'crypto-core-async';
import { ConnectionProviderService } from '../../../connection-provider';
import { Coin, KeyChainService } from '../../../keychain.service';
import { BitcoreWallet } from './bitcorewallet';

export class LitecoinWallet extends BitcoreWallet {
  constructor(endpoint: string,
              network: string,
              keychain: KeyChainService,
              account: number,
              connectionProviderService: ConnectionProviderService,
              ngZone: NgZone,
              worker: any) {
    super(
      LitecoinTransaction,
      CoreLitecoinWallet,
      endpoint,
      network,
      keychain,
      Coin.LTC,
      account,
      connectionProviderService,
      ngZone,
      worker
    );
  }

  public verifyAddress(address: string): boolean {
    return address &&
      /^[367LM][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  }
}
