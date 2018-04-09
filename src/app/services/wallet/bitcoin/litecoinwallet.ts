import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const CryptoCore: any;

export class LitecoinWallet extends BitcoreWallet {
  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(
      CryptoCore.LitecoinTransaction,
      CryptoCore.LTCInsightProvider,
      network,
      keychain,
      Coin.LTC,
      account,
      messageSubject,
      bt,
      ngZone);
  }
}
