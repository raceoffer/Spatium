import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const CryptoCore: any;

export class BitcoinCashWallet extends BitcoreWallet {
  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(
      CryptoCore.BitcoinCashTransaction,
      CryptoCore.InsightProvider,
      network,
      keychain,
      Coin.BCH,
      account,
      messageSubject,
      bt,
      ngZone);
  }
}
