import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const CryptoCore: any;

export class BitcoinCashWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(
      CryptoCore.BitcoinCashTransaction,
      CryptoCore.BitcoinCashWallet,
      endpoint,
      network,
      keychain,
      Coin.BCH,
      account,
      messageSubject,
      bt,
      ngZone);
  }

  public verifyAddress(address: string) : boolean {
    return address &&
           (super.verifyAddress(address) ||
            /^(bitcoincash:|bchtest:|bchreg:)[pq]([a-zA-Z0-9]{41})$/.test(address) );
  }
}
