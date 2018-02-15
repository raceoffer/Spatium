import { CurrencyWallet, HistoryEntry, Status, TransactionType } from '../currencywallet';
import { Coin, KeyChainService } from '../../keychain.service';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';
import { NgZone } from '@angular/core';

declare const bcoin: any;
declare const WatchingWallet: any;
declare const BlockchainInfoProvider: any;
declare const BitcoinTransaction: any;

export class BitcoinWallet extends CurrencyWallet {
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
    super(network, keychain, Coin.BTC, account, messageSubject, bt, ngZone);
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

    this.walletDB = new bcoin.walletdb({
      db: 'memory'
    });

    try {
      this.address.next(this.compoundKey.getCompoundKeyAddress('base58'));
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
          name: this.compoundKey.getCompoundKeyAddress('base58'),
          key: this.compoundKey.compoundPublicKeyring
        }]
      }).load(this.walletDB);
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to create watching wallet', e);
    }

    this.watchingWallet.on('balance', (balance) => this.ngZone.run(async () => {
      this.balance.next(balance);
      this.transactions.next(await this.listTransactionHistory());
    }));

    this.watchingWallet.on('transaction', (transaction) => this.ngZone.run(async () => {
      this.transactions.next(await this.listTransactionHistory());
    }));

    try {
      this.balance.next(await this.watchingWallet.getBalance());
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to get the balance', e);
    }

    // Start: configuring a provider
    this.provider = new BlockchainInfoProvider({
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

  public async createTransaction(address, value) {
    const transaction = BitcoinTransaction.fromOptions({
      network: this.network
    });

    /// Fill inputs and calculate script hashes
    try {
      await transaction.prepare({
        wallet: this.watchingWallet,
        address: address,
        value: value
      });
    } catch (e) {
      LoggerService.nonFatalCrash('Failed to prepare transaction', e);
    }

    return transaction;
  }

  public async listTransactionHistory() {
    const txs = await this.watchingWallet.getTransactions();

    return txs.map(record => {
      const inputs = record.tx.inputs.map(input => {
        const address = input.getAddress();
        return {
          address: address ? address.toString() : null
        };
      });
      const outputs = record.tx.outputs.map(output => {
        const address = bcoin.address.fromScript(output.script);
        return {
          address: address ? address.toString() : null,
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
          amount: output ? output.value : 0,
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
          amount: value,
          confirmed: record.meta !== null,
          time: record.meta == null ? null : record.meta.time
        });
      }
    });
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