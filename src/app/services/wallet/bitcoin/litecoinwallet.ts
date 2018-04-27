import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const CryptoCore: any;

export class LitecoinWallet extends BitcoreWallet {
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
      CryptoCore.LitecoinTransaction,
      CryptoCore.LitecoinWallet,
      endpoint,
      network,
      keychain,
      Coin.LTC,
      account,
      messageSubject,
      bt,
      ngZone);
  }
}