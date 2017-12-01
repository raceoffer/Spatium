import {OnInit} from '@angular/core';

import bcoin from 'bcoin';
import * as bcoinLib from 'bcoinlib';

// Dunno if it's appropriate here
bcoin.set('testnet');

const WatchingWallet = bcoinLib.watchingWallet;
const BlockCypherProvider = bcoinLib.blockCypherProvider;

export class BcoinComponent implements OnInit {
  private walletdb: bcoin.walletdb;
  private wallet:   WatchingWallet;
  private provider: BlockCypherProvider;

  privateKey: bcoin.KeyRing;

  ngOnInit(): void {
    this.walletdb = new bcoin.walletdb({
      db: 'leveldb',
      location: 'test'
    });

    this.privateKey = bcoin.keyring.fromSecret('cR9anA5WcxvD8hFzJgxxaBGwV4jt9YeJUdcTUBwoSbEgW2zfoGXc');
    console.log(this.privateKey.getKeyAddress('base58'));
  }

  async openWallet(): Promise<void> {
    await this.walletdb.open();

    // The wallet is intended to watch over the full public key
    this.wallet = await new WatchingWallet({
      watchingKey: bcoin.keyring.fromPublic(this.privateKey.getPublicKey())
    }).load(this.walletdb);

    this.wallet.on('transaction', (tx) => {
      console.log(tx);
    });

    this.wallet.on('balance', (newBalance) => {
      console.log('Balance:', bcoin.amount.btc(newBalance.confirmed), '(', bcoin.amount.btc(newBalance.unconfirmed), ')');
    });

    // End: configuring a wallet

    // Start: configuring a provider
    this.provider = new BlockCypherProvider();

    this.provider.on('rawTransaction', async (hex, meta) => {
      await this.wallet.addRawTransaction(hex, meta);
    });

    // End: configuring a provider
  }

  async startListening(): Promise<void> {
    // Displaying an initial (loaded from db) balance
    const balance = await this.wallet.getBalance();
    console.log('Balance:', bcoin.amount.btc(balance.confirmed), '(', bcoin.amount.btc(balance.unconfirmed), ')');

    setInterval(async () => {
      await this.provider.pullTransactions(this.wallet.getAddress('base58'));
    }, 5000);
  }
}
