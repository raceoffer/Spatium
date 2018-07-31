import * as CashAddr from 'cashaddrjs';
import { BitcoinCashTransaction, BitcoinCashWallet as CoreBitcoinCashWallet } from 'crypto-core-async';
import { ConnectionProviderService } from '../../connection-provider';
import { Coin, KeyChainService } from '../../keychain.service';
import { BitcoreWallet } from './bitcorewallet';

export class BitcoinCashWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    connectionProviderService: ConnectionProviderService,
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
      connectionProviderService,
      worker
    );
  }

  public verifyAddress(address: string, symbol: string): boolean {
    try {
      CashAddr.decode(address);
      return true;
    } catch (ignored) {
      return super.verifyAddress(address, symbol);
    }
  }
}
