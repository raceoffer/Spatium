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
    this.keyChain = this._seed ? KeyChain.fromSeed(this.seed) : null;
  }

  reset() {
    if (this._seed) {
      this._seed.fill(0);
      this._seed = null;
      this.keyChain = null;
    }
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
