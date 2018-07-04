import { BitcoreWallet } from './bitcorewallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';

import { LitecoinTransaction, LitecoinWallet as CoreLitecoinWallet } from 'crypto-core-async';

export class LitecoinWallet extends BitcoreWallet {
  constructor(
    endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    worker: any
  ) {
    super(
      LitecoinTransaction,
      CoreLitecoinWallet,
      endpoint,
      network,
      keychain,
      Coin.LTC,
      account,
      messageSubject,
      bt,
      worker
    );
  }
}
