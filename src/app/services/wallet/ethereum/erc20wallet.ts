import { CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService, Token } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

declare const CryptoCore: any;

export class ERC20Wallet extends CurrencyWallet {
  private erc20Wallet: any = null;
  private contractAddress: string = null;
  private token: Token = null;

  private routineTimerSub: any = null;

  constructor(
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone,
    token: Token,
    address: string
  ) {
    super(network, keychain, Coin.ETH, account, messageSubject, bt, ngZone);

    this.contractAddress = address;
    this.token = token;
  }

  public async reset() {
    await super.reset();

    this.erc20Wallet = null;

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }
  }

  public toInternal(amount: number): string {
    return this.erc20Wallet.toUnits(amount).toString();
  }

  public fromInternal(amount: string): number {
    return this.erc20Wallet.fromUnits(Number(amount));
  }

  public fee(transaction): number {
    return transaction.tx.gas * transaction.tx.gasPrice;
  }

  public fromJSON(tx) {
    return CryptoCore.EthereumTransaction.fromJSON(tx);
  }

  public outputs(transaction) {
    return transaction.transferData();
  }

  public currencyCode(): Coin | Token {
    return this.token;
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.erc20Wallet = await CryptoCore.ERC20Wallet.load({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      address: CryptoCore.ERC20Wallet.address(this.publicKey),
      contractAddress: this.contractAddress,
      network: this.network
    });

    this.address.next(this.erc20Wallet.address);

    this.routineTimerSub = Observable.timer(1000, 20000).subscribe(async () => {
      const balance = await this.erc20Wallet.getBalance();
      this.balance.next({
        confirmed: this.fromInternal(balance),
        unconfirmed: this.fromInternal(balance)
      });
    });

    this.status.next(Status.Ready);
  }

  public async syncDuplicate(other: CurrencyWallet) {
    await super.syncDuplicate(other);

    this.erc20Wallet = await CryptoCore.ERC20Wallet.load({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      address: CryptoCore.ERC20Wallet.address(this.publicKey),
      contractAddress: this.contractAddress,
      network: this.network
    });

    this.address.next(this.erc20Wallet.address);

    this.routineTimerSub = Observable.timer(1000, 20000).subscribe(async () => {
      const balance = await this.erc20Wallet.getBalance();
      this.balance.next({
        confirmed: this.fromInternal(balance),
        unconfirmed: this.fromInternal(balance)
      });
    });

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value, fee?) {
    return await this.erc20Wallet.createTransaction(
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
      await this.erc20Wallet.sendSignedTransaction(raw);
    }
  }
}
