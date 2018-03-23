import { Injectable } from '@angular/core';

declare const CryptoCore: any;
declare const Buffer: any;

export enum Coin {
  BTC = 0,
  BTC_test = 1,
  ETH = 60,
  BCH = 145
}

export enum Token {
  EOS = 56146,
  TRON = 56147,
  VECHAIN = 56148,
  ICON = 56149,
  OMNISEGO = 56150,
  BINACLECOIN = 56151,
  DIGIXDAO = 56152,
  POPULUS = 56153,
  RCHAIN = 56154,
  MAKER = 56155,
  AETHERNITY = 56156
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
    this.keyChain = this._seed ? CryptoCore.KeyChain.fromSeed(Buffer.from(seed)) : null;
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
