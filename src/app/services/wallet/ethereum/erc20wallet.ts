import { CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

declare const ERC20Wallet: any;
declare const Currency: any;

export class ERC20CurrencyWallet extends CurrencyWallet {
  private erc20Wallet: any = null;
  private currencyCoin: any = null;
  private contractAddress: string = null;

  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone,
    coin: Coin,
    address: string
  ) {
    super(network, keychain, coin, account, messageSubject, bt, ngZone);

    this.contractAddress = address;

    this.currencyCoin = Currency.get(Currency.ETH);
  }

  public async reset() {
    await super.reset();

    this.erc20Wallet = null;
  }

  public toInternal(amount: number): string {
    return this.erc20Wallet.toUnits(amount).toString();
  }

  public fromInternal(amount: string): number {
    return this.erc20Wallet.fromUnits(Number(amount));
  }

  public fromJSON(tx) {
    return this.currencyCoin.fromJSON(tx);
  }

  public outputs(transaction) {
    return [{ address: 'contract', value: '100500' }];
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.erc20Wallet = await new ERC20Wallet({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      address: this.currencyCoin.address(this.compoundKey.getCompoundPublicKey()),
      contractAddress: this.contractAddress,
      network: this.network
    }).load();

    this.address.next(this.erc20Wallet.address);

    this.erc20Wallet.on('balance', (balance) => this.ngZone.run(async () => {
      this.balance.next({
        confirmed: this.fromInternal(balance),
        unconfirmed: this.fromInternal(balance)
      });
    }));

    let initialBalance = '0';
    try {
      initialBalance = await this.erc20Wallet.getBalance();
    } catch (ignored) {}
    this.balance.next({
      confirmed: this.fromInternal(initialBalance),
      unconfirmed: this.fromInternal(initialBalance)
    });

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value) {
    const transaction = await this.erc20Wallet.createTransaction(
      address,
      this.toInternal(value),
      '5000000000'
    );

    return transaction;
  }

  public async listTransactionHistory() {
    return [];
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      const raw = this.signSession.transaction.toRaw();
      await this.erc20Wallet.sendSignedTransaction(raw);
    }
  }
}
