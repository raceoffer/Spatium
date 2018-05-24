import { Balance, CurrencyWallet, Status } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ConnectivityService } from '../../connectivity.service';

declare const CryptoCore: any;

export class EthereumWallet extends CurrencyWallet {
  private wallet: any = null;
  private routineTimerSub: any = null;

  constructor(
    private endpoint: string,
    network: string,
    keychain: KeyChainService,
    account: number,
    connectivityService: ConnectivityService,
    ngZone: NgZone
  ) {
    super(network, keychain, Coin.ETH, account, connectivityService, ngZone);
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
          balance.confirmed,
          balance.unconfirmed
        ));
      } catch (ignored) {}
    });

    this.status.next(Status.Ready);
  }

  public verifyAddress(address: string): boolean {
    return this.wallet.verifyAddress(address);
  }

  public async createTransaction(address: string, value: any, fee?: any) {
    return await this.wallet.prepareTransaction(
      new CryptoCore.EthereumTransaction(),
      address,
      value,
      fee ? fee : undefined
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
