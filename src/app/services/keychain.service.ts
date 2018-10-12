import { Injectable } from '@angular/core';
import { KeyChain } from 'crypto-core-async';
import { BehaviorSubject } from 'rxjs';
import { toBehaviourSubject } from '../utils/transformers';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable()
export class KeyChainService {
  private _seed = new BehaviorSubject<Buffer>(null);
  private _keyChain = toBehaviourSubject(this._seed.pipe(
    map((seed) => seed ? KeyChain.fromSeed(Buffer.from(seed)) : null)
  ), null);

  private _sessionId = new BehaviorSubject<string>(null);
  private _paillierPublicKey = new BehaviorSubject<string>(null);
  private _paillierSecretKey = new BehaviorSubject<string>(null);

  public seedEvent = this._seed.pipe(distinctUntilChanged());
  public sessionIdEvent = this._sessionId.pipe(distinctUntilChanged());
  public paillierPublicKeyEvent = this._paillierPublicKey.pipe(distinctUntilChanged());
  public paillierSecretKeyEvent = this._paillierSecretKey.pipe(distinctUntilChanged());

  public get seed(): Buffer {
    return Buffer.from(this._seed.getValue());
  }

  public set seed(seed: Buffer) {
    this._seed.next(Buffer.from(seed));
  }

  public get sessionId(): string {
    return this._sessionId.getValue();
  }

  public get paillierPublicKey(): any {
    return this._paillierPublicKey.getValue();
  }

  public get paillierSecretKey(): any {
    return this._paillierSecretKey.getValue();
  }

  public set sessionId(sessionId: string) {
    this._sessionId.next(sessionId);
  }

  public set paillierPublicKey(paillierPublicKey: any) {
    this._paillierPublicKey.next(paillierPublicKey);
  }

  public set paillierSecretKey(paillierSecretKey: any) {
    this._paillierSecretKey.next(paillierSecretKey);
  }

  public privateBytes(coin: number, account: number) {
    return this._keyChain.getValue() ? this._keyChain.getValue().getAccountSecret(coin, account) : null;
  }

  public reset() {
    this._seed.next(null);
    this._sessionId.next(null);
    this._paillierPublicKey.next(null);
    this._paillierSecretKey.next(null);
  }
}
