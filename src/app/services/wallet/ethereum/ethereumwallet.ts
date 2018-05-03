import { Balance, CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

declare const CryptoCore: any;

export class EthereumWallet extends CurrencyWallet {
  private wallet: any = null;
  private routineTimerSub: any = null;

  constructor(
    private endpoint: string,
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

    this.wallet = null;

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }
  }

  public toInternal(amount: number): string {
    return this.wallet.toInternal(amount.toString());
  }

  public fromInternal(amount: string): number {
    return Number(this.wallet.fromInternal(amount));
  }

  public async fromJSON(tx) {
    return await CryptoCore.EthereumTransaction.fromJSON(tx);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.wallet = await CryptoCore.EthereumWallet.fromOptions({
      infuraToken: 'DKG18gIcGSFXCxcpvkBm',
      key: this.publicKey,
      network: this.network,
      endpoint: this.endpoint,
    });

    this.address.next(this.wallet.address);

    this.routineTimerSub = Observable.timer(1000, 20000).subscribe(async () => {
      try {
        const balance = await this.wallet.getBalance();
        this.balance.next(new Balance(
          this.fromInternal(balance.confirmed),
          this.fromInternal(balance.unconfirmed)
        ));
      } catch (ignored) {}
    });

    this.status.next(Status.Ready);
  }

  public async createTransaction(address, value, fee?) {
    return await this.wallet.prepareTransaction(
      new CryptoCore.EthereumTransaction(),
      address,
      this.toInternal(value),
      fee ? this.toInternal(fee.toString()) : undefined
    );
  }

  public async listTransactionHistory() {
    await Observable.timer(1000).toPromise();
    return [];
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      const raw = await this.signSession.transaction.toRaw();
      await this.wallet.sendSignedTransaction(raw);
    }
  }
}
