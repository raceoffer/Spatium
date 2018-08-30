import { Injectable } from '@angular/core';

import { PedersenParameters, PedersenCommitment, SchnorrProof, Convert } from 'crypto-core-async';

export enum SyncState {
  None = 0,
  Started = 1,
  Revealed = 2,
  Commited = 3,
  Finalized = 4,
}

export class Currency {
  private readonly _id: string;
  private _state: SyncState = SyncState.None;

  public get id(): string {
    return this._id;
  }

  public get state(): SyncState {
    return this._state;
  }

  public constructor(id: string) {
    this._id = id;
  }

  public async processCommitment(commitment: { params: any, i: any }): Promise<{ Q: any, proof: any }> {
    const proof = SchnorrProof.fromOptions({
      curve: 'secp256k1',
      x: commitment.i.C.getX()
    });
    return {
      Q: commitment.i.C,
      proof: proof
    };
  }
}

export class DeviceSession {
  private readonly _id: Buffer;
  private _currencies = new Map<string, Currency>();

  public get id(): Buffer {
    return this._id;
  }

  public get currencies(): Array<Currency> {
    return Array.from(this._currencies.values());
  }

  public constructor(id: Buffer) {
    this._id = id;
  }

  public async startSync(currencyId: string, commitment: { params: any, i: any }): Promise<{ Q: any, proof: any }> {
    const currency = new Currency(currencyId);

    this._currencies.set(currencyId, currency);

    return await currency.processCommitment(commitment);
  }
}

@Injectable()
export class VerifierService {
  private sessions = new Map<string, DeviceSession>();

  public constructor() {}

  /**
   * Checks if this session Id is registered and registers it otherwise
   * @param sessionId session Id of the main device
   */
  public async registerSession(sessionId: Buffer): Promise<boolean> {
    const stringId = sessionId.toString('hex');

    if (this.sessions.has(stringId)) {
      return true;
    }

    this.sessions.set(stringId, new DeviceSession(sessionId));

    return false;
  }

  /**
   * Checks if this session Id is registered and removes it
   * @param sessionId session Id of the main device
   */
  public async clearSession(sessionId: Buffer): Promise<boolean> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      return false;
    }

    this.sessions.delete(stringId);

    return true;
  }

  public async syncStatus(sessionId: Buffer): Promise<Array<{ currencyId: string, state: SyncState }>> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      throw new Error('Unknown session id');
    }

    return this.sessions.get(stringId).currencies.map((currency: Currency) => {
      return {
        currencyId: currency.id,
        state: currency.state
      };
    });
  }

  public async startSync(sessionId: Buffer, currencyId: string, commitment: { params: any, i: any }): Promise<{ Q: any, proof: any }> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(stringId).startSync(currencyId, commitment);
  }
}
