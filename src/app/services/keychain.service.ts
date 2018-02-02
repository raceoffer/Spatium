import { Injectable } from '@angular/core';

declare const KeyChain: any;

export enum Coin {
  BTC = 0,
  ETH = 60
}

@Injectable()
export class KeyChainService {
  private _seed: any = null;
  private keyChain: any = null;

  get seed() {
    return this._seed;
  }

  set seed(seed) {
    this._seed = seed;
    this.keyChain = KeyChain.fromSeed(this.seed);
  }

  getCoinSecret(coin: Coin, account: number) {
    return this.keyChain ? this.keyChain.getAccountSecret(coin, account) : null;
  }

  getBitcoinSecret(account: number) {
    return this.getCoinSecret(Coin.BTC, account);
  }

  getEthereumSecret(account: number) {
    return this.getCoinSecret(Coin.ETH, account);
  }

  constructor() { }
}
