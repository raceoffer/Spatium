import { CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const EthereumWallet: any;
declare const EthereumTransaction: any;

export class EthereumCurrencyWallet extends CurrencyWallet {
  private ethereumWallet: any = null;

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
    return EthereumTransaction.fromJSON(tx);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.ethereumWallet = await new EthereumWallet({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      address: EthereumWallet.address(this.compoundKey.getCompoundPublicKey()),
      network: this.network
    }).load();

    this.address.next(this.ethereumWallet.address);

    this.ethereumWallet.on('balance', (balance) => this.ngZone.run(async () => {
      this.balance.next({
        confirmed: this.fromInternal(balance),
        unconfirmed: this.fromInternal(balance)
      });
    }));

    let initialBalance = '0';
    try {
      initialBalance = await this.ethereumWallet.getBalance();
    } catch (ignored) {}
    this.balance.next({
      confirmed: this.fromInternal(initialBalance),
      unconfirmed: this.fromInternal(initialBalance)
    });

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value, fee?) {
    const transaction = await this.ethereumWallet.createTransaction(
      address,
      this.toInternal(value),
      fee ? this.toInternal(fee.toString()) : undefined
    );

    return transaction;
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
