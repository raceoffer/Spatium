import {CurrencyWallet, HistoryEntry, Status, TransactionType} from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

declare const bcoin: any;
declare const WatchingWallet: any;
declare const InsightProvider: any;
declare const BitcoinCashTransaction: any;

export class BitcoinCashWallet extends CurrencyWallet {
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
    super(network, keychain, Coin.BCH, account, messageSubject, bt, ngZone);
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

  public toInternal(amount: number): string {
    return bcoin.amount.fromBTC(amount);
  }

  public fromInternal(amount: string): number {
    return Number(bcoin.amount.btc(Number(amount)));
  }

  public fromJSON(tx) {
    return BitcoinCashTransaction.fromJSON(tx);
  }

  public async finishSync(data) {
    await super.finishSync(data);

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });

    const keyring = bcoin.keyring.fromPublic(
      Buffer.from(
        this.compoundKey.getCompoundPublicKey().encode(true, 'array')
      ),
      this.network
    );

    try {
      this.address.next(keyring.getKeyAddress('base58'));
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get compound key address', e);
    }

    try {
      await this.walletDB.open();
    } catch (e) {
      LoggerService.nonFatalCrash('Failed open database', e);
    }

    try {
      this.watchingWallet = await new WatchingWallet({
        accounts: [{
          name: keyring.getKeyAddress('base58'),
          key: keyring
        }]
      }).load(this.walletDB);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create watching wallet', e);
    }

    this.watchingWallet.on('balance', (balance) => this.ngZone.run(async () => {
      this.balance.next({
        confirmed: this.fromInternal(balance.confirmed),
        unconfirmed: this.fromInternal(balance.unconfirmed)
      });
      this.transactions.next(await this.listTransactionHistory());
    }));

    this.watchingWallet.on('transaction', (transaction) => this.ngZone.run(async () => {
      this.transactions.next(await this.listTransactionHistory());
    }));

    try {
      const balance = await this.watchingWallet.getBalance();
      this.balance.next({
        confirmed: this.fromInternal(balance.confirmed),
        unconfirmed: this.fromInternal(balance.unconfirmed)
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get the balance', e);
    }

    // Start: configuring a provider
    this.provider = new InsightProvider({
      network: this.network
    });

    this.provider.on('transaction', async (hash, meta) => {
      let hex = await this.watchingWallet.getRawTransaction(hash);
      if (!hex) {
        hex = await this.provider.pullRawTransaction(hash);
      }
      await this.watchingWallet.addRawTransaction(hex, meta);
    });

    // Initiate update routine

    try {
      this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(() => {});
      clearInterval(this.routineTimer);
      this.routineTimer = setInterval(() => {
        this.provider.pullTransactions(this.watchingWallet.getAddress('base58')).catch(() => {});
      }, 20000);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to pull transactions into provider', e);
    }

    // End: configuring a provider

    this.status.next(Status.Ready);
  }

  public async listTransactionHistory() {
    const txs = await this.watchingWallet.getTransactions();

    return txs.map(record => {
      const inputs = record.tx.inputs.map(input => {
        const address = input.getAddress();
        return {
          address: address ? address.toString(this.network) : null
        };
      });
      const outputs = record.tx.outputs.map(output => {
        const address = bcoin.address.fromScript(output.script);
        return {
          address: address ? address.toString(this.network) : null,
          value: output.value
        };
      });

      if (inputs.some(input => input.address === this.watchingWallet.getAddress('base58'))) { // out
        // go find change
        const output = outputs.length > 0 ? outputs[0] : null;

        return HistoryEntry.fromJSON({
          type: TransactionType.Out,
          from: this.watchingWallet.getAddress('base58'),
          to: output ? output.address : null,
          amount: this.fromInternal(output ? output.value : 0),
          confirmed: record.meta !== null,
          time: record.meta == null ? null : record.meta.time
        });
      } else { // in
        // go find our output
        const value =
          outputs
            .filter(output => output.address === this.watchingWallet.getAddress('base58'))
            .reduce((sum, output) => sum + output.value, 0);
        return HistoryEntry.fromJSON({
          type: TransactionType.In,
          from: inputs[0].address,
          to: this.watchingWallet.getAddress('base58'),
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
    const transaction = BitcoinCashTransaction.fromOptions({
      network: this.network
    });

    /// Fill inputs and calculate script hashes
    try {
      await transaction.prepare({
        wallet: this.watchingWallet,
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
