import { CurrencyWallet, HistoryEntry, Status, TransactionType } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

export class EthereumWallet extends CurrencyWallet {
  private walletDB: any = null;
  private watchingWallet: any = null;
  private provider: any = null;
  private routineTimer: any = null;

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

    if (this.routineTimer) {
      clearInterval(this.routineTimer);
    }

    this.walletDB = null;
    this.watchingWallet = null;
    this.provider = null;
  }

  public async finishSync(data) {
    await super.finishSync(data);

    // this.address.next(this.compoundKey.getCompoundKeyAddress('base58'));

    // this.watchingWallet.on('balance', (balance) => this.ngZone.run(async () => {
    //   this.balance.next(balance);
    //   this.transactions.next(await this.listTransactionHistory());
    // }));

    // this.watchingWallet.on('transaction', (transaction) => this.ngZone.run(async () => {
    //   this.transactions.next(await this.listTransactionHistory());
    // }));

    // this.balance.next(await this.watchingWallet.getBalance());

    // this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(() => {});
    // clearInterval(this.routineTimer);
    // this.routineTimer = setInterval(() => {
    //   this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(() => {});
    // }, 20000);

    // End: configuring a provider

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value) {
    const transaction = null;

    // BitcoinTransaction.fromOptions({
    //   network: this.network
    // });

    return transaction;
  }

  public async listTransactionHistory() {
    return [];
  }

  public async pushTransaction() {
    return;
  }
}
