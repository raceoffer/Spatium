import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const CryptoCore: any;

export class BitcoinWallet extends BitcoreWallet {
  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(
      CryptoCore.BitcoinTransaction,
      CryptoCore.BlockchainInfoProvider,
      network,
      keychain,
      network === 'main' ? Coin.BTC : Coin.BTC_test,
      account,
      messageSubject,
      bt,
      ngZone);
  }
}
