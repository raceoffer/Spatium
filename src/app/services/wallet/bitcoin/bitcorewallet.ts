import {CurrencyWallet, HistoryEntry, Status, TransactionType} from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

import { Observable } from 'rxjs/Observable';

declare const Buffer: any;
declare const CryptoCore: any;

export class BitcoreWallet extends CurrencyWallet {
  private bitcoreWallet: any = null;
  private provider: any = null;

  private routineTimerSub: any = null;

  constructor(
    private Transaction: any,
    private Provider: any,
    network: string,
    keychain: KeyChainService,
    coin: Coin,
    account: number,
    messageSubject: any,
    bt: BluetoothService,
    ngZone: NgZone
  ) {
    super(network, keychain, coin, account, messageSubject, bt, ngZone);
  }

  public async reset() {
    await super.reset();

    if (this.routineTimerSub) {
      this.routineTimerSub.unsubscribe();
      this.routineTimerSub = null;
    }

    this.bitcoreWallet = null;
    this.provider = null;
  }

  public toInternal(amount: number): string {
    return CryptoCore.BitcoreWallet.toInternal(amount);
  }

  public fromInternal(amount: string): number {
    return Number(CryptoCore.BitcoreWallet.fromInternal(Number(amount)));
  }

  public fromJSON(tx) {
    return this.Transaction.fromJSON(tx);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    try {
      this.bitcoreWallet = await CryptoCore.BitcoreWallet.load({
        accounts: [{
          key: this.publicKey
        }],
        network: this.network
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create watching wallet', e);
    }

    try {
      this.address.next(this.bitcoreWallet.getAddress('base58'));
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get compound key address', e);
    }

    this.balance.next({
      confirmed: this.fromInternal('0'),
      unconfirmed: this.fromInternal('0')
    });

    this.bitcoreWallet.on('balance', (balance) => this.ngZone.run(async () => {
      this.balance.next({
        confirmed: this.fromInternal(balance.confirmed),
        unconfirmed: this.fromInternal(balance.unconfirmed)
      });
      this.transactions.next(await this.listTransactionHistory());
    }));

    // Start: configuring a provider
    this.provider = new this.Provider({
      network: this.network
    });

    this.provider.on('transaction', async (hash, meta) => {
      let hex = await this.bitcoreWallet.getRawTransaction(hash);
      if (!hex) {
        hex = await this.provider.pullRawTransaction(hash);
      }
      await this.bitcoreWallet.addRawTransaction(hex, meta);
    });

    // Initiate update routine
    this.routineTimerSub = Observable.timer(1000, 20000).subscribe(async () => {
      try {
        await this.provider.pullTransactions(this.bitcoreWallet.getAddress('base58'));
      } catch (e) {
        console.log(e);
      }
    });

    // End: configuring a provider

    this.status.next(Status.Ready);
  }

  public async listTransactionHistory() {
    const txs = await this.bitcoreWallet.getTransactions();

    return txs.map(record => {
      const inputs = record.tx.inputs.map(input => {
        const address = input.getAddress();
        return {
          address: address ? address.toString(this.network) : null
        };
      });
      const outputs = record.tx.outputs.map(output => {
        const address = CryptoCore.BitcoreWallet.addressFromScript(output.script);
        return {
          address: address ? address.toString(this.network) : null,
          value: output.value
        };
      });

      if (inputs.some(input => input.address === this.bitcoreWallet.getAddress('base58'))) { // out
        // go find change
        const output = outputs.length > 0 ? outputs[0] : null;

        return HistoryEntry.fromJSON({
          type: TransactionType.Out,
          from: this.bitcoreWallet.getAddress('base58'),
          to: output ? output.address : null,
          amount: this.fromInternal(output ? output.value : 0),
          confirmed: record.meta !== null,
          time: record.meta == null ? null : record.meta.time
        });
      } else { // in
        // go find our output
        const value =
          outputs
            .filter(output => output.address === this.bitcoreWallet.getAddress('base58'))
            .reduce((sum, output) => sum + output.value, 0);
        return HistoryEntry.fromJSON({
          type: TransactionType.In,
          from: inputs[0].address,
          to: this.bitcoreWallet.getAddress('base58'),
          amount: this.fromInternal(value),
          confirmed: record.meta !== null,
          time: record.meta == null ? null : record.meta.time
        });
      }
    });
  }

  public verify(transaction: any, maxFee?: number): boolean {
    if (!super.verify(transaction, maxFee)) {
      return false;
    }

    const statistics = transaction.totalOutputs();

    // check if every input belongs to owned address
    if (!statistics.inputs
      || statistics.inputs.length < 1
      || statistics.inputs.some(input => input.address !== this.address.getValue())) {
      return false;
    }

    // check if change goes to owned address
    if (statistics.change.some(change => change.address !== this.address.getValue())) {
      return false;
    }

    // check for tax value
    const fee = this.fee(transaction);

    return !(maxFee ? fee > maxFee : false);
  }

  public fee(transaction): number {
    const statistics = transaction.totalOutputs();

    let fee = 0;
    fee += statistics.inputs.reduce((sum, input) => sum + input.value, 0);
    fee -= statistics.outputs.reduce((sum, output) => sum + output.value, 0);
    fee -= statistics.change.reduce((sum, change) => sum + change.value, 0);

    return fee;
  }

  public async createTransaction(
    address: string,
    value: number,
    fee?: number
  ) {
    const transaction = this.Transaction.fromOptions({
      network: this.network
    });

    /// Fill inputs and calculate script hashes
    try {
      await transaction.prepare({
        wallet: this.bitcoreWallet,
        address: address,
        value: Number(this.toInternal(value)),
        fee: fee ? Number(this.toInternal(fee)) : undefined
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to prepare transaction', e);
    }

    return transaction;
  }

  public async pushTransaction() {
    if (this.signSession.transaction) {
      try {
        const raw = this.signSession.transaction.toRaw();
        await this.provider.pushTransaction(raw);
      } catch (e) {
        LoggerService.nonFatalCrash('Failed to push transaction', e);
      }
    }
  }
}
