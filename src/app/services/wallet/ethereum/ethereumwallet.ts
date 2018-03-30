import { CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

declare const CryptoCore: any;

export class EthereumWallet extends CurrencyWallet {
  private ethereumWallet: any = null;
  private routineTimerSub: any = null;

  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(network, keychain, Coin.ETH, account, messageSubject, bt, ngZone);
  }

  public async reset() {
    await super.reset();

    this.ethereumWallet = null;

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }
  }

  public fee(transaction): number {
    return transaction.tx.gas * transaction.tx.gasPrice;
  }

  public toInternal(amount: number): string {
    return this.ethereumWallet.toWei(amount.toString(), 'ether');
  }

  public fromInternal(amount: string): number {
    return Number(this.ethereumWallet.fromWei(amount, 'ether'));
  }

  public fromJSON(tx) {
    return CryptoCore.EthereumTransaction.fromJSON(tx);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.ethereumWallet = await CryptoCore.EthereumWallet.load({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      address: CryptoCore.EthereumWallet.address(this.publicKey),
      network: this.network
    });

    this.address.next(this.ethereumWallet.address);

    this.routineTimerSub = Observable.timer(1000, 20000).subscribe(async () => {
      const balance = await this.ethereumWallet.getBalance();
      this.balance.next({
        confirmed: this.fromInternal(balance),
        unconfirmed: this.fromInternal(balance)
      });
    });

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value, fee?) {
    return await this.ethereumWallet.createTransaction(
      address,
      this.toInternal(value),
      fee ? this.toInternal(fee.toString()) : undefined
    );
  }

  public async listTransactionHistory() {
    return [];
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      const raw = this.signSession.transaction.toRaw();
      await this.ethereumWallet.sendSignedTransaction(raw);
    }
  }
}
