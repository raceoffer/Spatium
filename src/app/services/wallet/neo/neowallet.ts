import { NeoTransaction, NeoWallet as CoreNeoWallet } from 'crypto-core-async';
import { from, of, timer } from 'rxjs';
import { catchError, expand, filter, map, mergeMap } from 'rxjs/operators';
import { ConnectionProviderService } from '../../connection-provider';
import { Coin, KeyChainService } from '../../keychain.service';
import {Balance, Status, getRandomDelay, HistoryEntry} from '../currencywallet';
import { EcdsaCurrencyWallet } from '../ecdsacurrencywallet';

export class NeoWallet extends EcdsaCurrencyWallet {
  private wallet: any = null;
  private routineTimerSub: any = null;

  constructor(private endpoint: string,
              network: string,
              keychain: KeyChainService,
              account: number,
              messageSubject: any,
              connectionProviderService: ConnectionProviderService,
              worker: any) {
    super(
      network,
      keychain,
      network === 'main' ? Coin.NEO : Coin.NEO_test,
      account,
      messageSubject,
      connectionProviderService,
      worker,
      'p256'
    );
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
    return await NeoTransaction.fromJSON(tx, this.worker);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.wallet = await CoreNeoWallet.fromOptions({
      point: this.publicKey,
      network: this.network,
      endpoint: this.endpoint,
    });

    const request = () => from(this.wallet.getBalance()).pipe(
      catchError(e => of(null)));

    this.address.next(this.wallet.address);
    this.routineTimerSub = timer(getRandomDelay()).pipe(
      mergeMap(() =>
        request().pipe(
          expand(() =>
            timer(60000).pipe(
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

  public verifyAddress(address: string, ignored): boolean {
    return this.wallet.verifyAddress(address);
  }

  public async createTransaction(address: string, value: any, fee?: any) {
    return await this.wallet.prepareTransaction(
      await NeoTransaction.create(this.worker),
      address,
      value,
      fee ? fee : undefined
    );
  }

  public async listTransactionHistory(to, from) {
    if (this.wallet === null) {
      return null;
    }

    const txs = await this.wallet.getTransactions(to, from);
    return txs.map(tx => HistoryEntry.fromJSON(tx));
  }

  public async pushTransaction() {

    if (this.signSession.transaction) {
      const raw = await this.signSession.transaction.toRaw();
      await this.wallet.sendSignedTransaction(raw);
    }
  }
}
