import { LitecoinTransaction, LitecoinWallet as CoreLitecoinWallet } from 'crypto-core-async';
import { ConnectionProviderService } from '../../connection-provider';
import { Coin, KeyChainService } from '../../keychain.service';
import { BitcoreWallet } from './bitcorewallet';

export class LitecoinWallet extends BitcoreWallet {
  constructor(endpoint: string,
              network: string,
              keychain: KeyChainService,
              account: number,
              messageSubject: any,
              connectionProviderService: ConnectionProviderService,
              worker: any) {
    super(
      LitecoinTransaction,
      CoreLitecoinWallet,
      endpoint,
      network,
      keychain,
      Coin.LTC,
      account,
      messageSubject,
      connectionProviderService,
      worker
    );
  }
}
