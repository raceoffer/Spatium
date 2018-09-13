import { Injectable } from '@angular/core';
import { KeyChain } from 'crypto-core-async';

@Injectable()
export class KeyChainService {

  private _seed: Buffer = null;
  private keyChain: any = null;

  public sessionId: string = null;
  public paillierPublicKey: any = null;
  public paillierSecretKey: any = null;

  get seed(): Buffer {
    return Buffer.from(this._seed);
  }

  set seed(seed: Buffer) {
    this._seed = Buffer.from(seed);
    this.keyChain = this._seed ? KeyChain.fromSeed(Buffer.from(seed)) : null;
  }

  privateBytes(coin: number, account: number) {
    return this.keyChain ? this.keyChain.getAccountSecret(coin, account) : null;
  }

  reset() {
    if (this._seed) {
      this._seed.fill(0);
    }

    this._seed = null;
    this.keyChain = null;
    this.sessionId = null;
    this.paillierPublicKey = null;
    this.paillierSecretKey = null;
  }
}
