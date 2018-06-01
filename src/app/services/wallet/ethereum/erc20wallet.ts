import { Balance, CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService, Token } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';

import { from, of, timer } from 'rxjs';
import { expand, map, mergeMap, filter, catchError } from 'rxjs/operators';

import { EthereumTransaction, ERC20Wallet as CoreERC20Wallet } from 'crypto-core-async';

export class ERC20Wallet extends CurrencyWallet {
  private wallet: any = null;
  private contractAddress: string = null;
  private token: Token = null;
  private decimals = 18;

  private routineTimerSub: any = null;

  constructor(
    private endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone,
    worker: any,
    token: Token,
    address: string,
    decimals: number = 18
  ) {
    super(network, keychain, Coin.ETH, account, messageSubject, bt, ngZone, worker);

    this.contractAddress = address;
    this.token = token;
    this.decimals = decimals;
  }

  public async reset() {
    await super.reset();

    this.wallet = null;

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }
  }

  public toInternal(amount: number): any {
    return this.wallet.toInternal(amount);
  }

  public fromInternal(amount: any): number {
    return this.wallet.fromInternal(amount);
  }

  public async fromJSON(tx) {
    return await EthereumTransaction.fromJSON(tx, this.worker);
  }

  public currencyCode(): Coin | Token {
    return this.token;
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.wallet = await CoreERC20Wallet.fromOptions({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      key: this.publicKey,
      network: this.network,
      contractAddress: this.contractAddress,
      decimals: this.decimals,
      endpoint: this.endpoint,
    });

    const request = () => from(this.wallet.getBalance()).pipe(
      catchError(e => of(null)));

    this.address.next(this.wallet.address);
    this.routineTimerSub = timer(1000).pipe(
      mergeMap(() =>
        request().pipe(
          expand(() =>
            timer(20000).pipe(
              mergeMap(() => request())
            )
          )
        )
      ),
      filter(r => r),
      map((balance: any) => new Balance(
        balance.confirmed,
        balance.unconfirmed
      ))
    ).subscribe(balance => this.balance.next(balance));

    this.status.next(Status.Ready);
  }

  public async syncDuplicate(other: CurrencyWallet) {
    await super.syncDuplicate(other);

    this.wallet = await CoreERC20Wallet.fromOptions({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      key: this.publicKey,
      contractAddress: this.contractAddress,
      network: this.network,
      decimals: this.decimals,
      endpoint: this.endpoint,
    });

    const request = () => from(this.wallet.getBalance()).pipe(
      catchError(e => of(null)));

    this.address.next(this.wallet.address);
    this.routineTimerSub = timer(1000).pipe(
      mergeMap(() =>
        request().pipe(
          expand(() =>
            timer(20000).pipe(
              mergeMap(() => request())
            )
          )
        )
      ),
      filter(r => r),
      map((balance: any) => new Balance(
        balance.confirmed,
        balance.unconfirmed
      ))
    ).subscribe(balance => this.balance.next(balance));

    this.status.next(Status.Ready);
  }

  public verifyAddress(address: string): boolean {
    return this.wallet.verifyAddress(address);
  }

  public async createTransaction(address: string, value: any, fee?: any) {
    return await this.wallet.prepareTransaction(
      await EthereumTransaction.create(this.worker),
      address,
      value,
      fee ? fee : undefined
    );
  }

  public async listTransactionHistory() {
    await timer(1000).toPromise();
    return [];
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      const raw = await this.signSession.transaction.toRaw();
      await this.wallet.sendSignedTransaction(raw);
    }
  }
}
