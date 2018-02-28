import { Injectable } from '@angular/core';

declare const KeyChain: any;

export enum Coin {
  BTC = 0,
  ETH = 60,
  BCH = 145
}

export enum Token {
  EOS = 56146
}

@Injectable()
export class KeyChainService {
  private _seed: any = null;
  private keyChain: any = null;

  getSeed() {
    return Buffer.from(this._seed);
  }

  setSeed(seed) {
    this._seed = Buffer.from(seed);
    this.keyChain = this._seed ? KeyChain.fromSeed(Buffer.from(seed)) : null;
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

  constructor() { }
}
