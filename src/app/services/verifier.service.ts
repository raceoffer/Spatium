import { Injectable } from '@angular/core';

import {
  KeyChain,
  DistributedEcdsaKeyShard,
  Curve
} from 'crypto-core-async';

export enum SyncState {
  None = 0,
  Started = 1,
  Revealed = 2,
  Responded = 3,
  Finalized = 4,
}

const seed = Buffer.from(
  '9ff992e811d4b2d2407ad33b263f567698c37bd6631bc0db90223ef10bce7dca28b8c670522667451430a1cb10d1d6b114234d1c2220b2f4229b00cadfc91c4d',
  'hex'
);

export class Currency {
  private readonly _id: string;
  private _state: SyncState = SyncState.None;
  private _distributedKeyShard: any;
  private _syncSessionShard: any;

  public get id(): string {
    return this._id;
  }

  public get state(): SyncState {
    return this._state;
  }

  public constructor(id: string) {
    this._id = id;
  }

  public async startSync(initialCommitment: any): Promise<any> {
    const keyChain = KeyChain.fromSeed(seed);

    const verifierPrivateBytes = keyChain.getAccountSecret(61, 0);

    this._distributedKeyShard = await DistributedEcdsaKeyShard.fromOptions({
      curve: Curve.secp256k1,
      secret: verifierPrivateBytes
    });

    this._syncSessionShard = await this._distributedKeyShard.startSyncSession();

    const initialData = await this._syncSessionShard.processInitialCommitment(initialCommitment);

    this._state = SyncState.Started;

    return initialData;
  }

  public async syncReveal(initialDecommitment: any): Promise<any> {
    if (this._state !== SyncState.Started) {
      throw new Error('Invalid session state');
    }

    const challengeCommitment = await this._syncSessionShard.processInitialDecommitment(initialDecommitment);

    this._state = SyncState.Revealed;

    return challengeCommitment;
  }

  public async syncResponse(responseCommitment: any): Promise<any> {
    if (this._state !== SyncState.Revealed) {
      throw new Error('Invalid session state');
    }

    const challengeDecommitment = await this._syncSessionShard.processResponseCommitment(responseCommitment);

    this._state = SyncState.Responded;

    return challengeDecommitment;
  }

  public async syncFinalize(responseDecommitment: any): Promise<any> {
    if (this._state !== SyncState.Responded) {
      throw new Error('Invalid session state');
    }

    const shardSyncData = await this._syncSessionShard.processResponseDecommitment(responseDecommitment);

    await this._distributedKeyShard.importSyncData(shardSyncData);

    this._state = SyncState.Finalized;

    return;
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

  public async startSync(currencyId: string, initialCommitment: any): Promise<any> {
    const currency = new Currency(currencyId);

    this._currencies.set(currencyId, currency);

    return await currency.startSync(initialCommitment);
  }

  public async syncReveal(currencyId: string, initialDecommitment: any): Promise<any> {
    if (!this._currencies.get(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    return await currency.syncReveal(initialDecommitment);
  }

  public async syncResponse(currencyId: string, responseCommitment: any): Promise<any> {
    if (!this._currencies.get(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    return await currency.syncResponse(responseCommitment);
  }

  public async syncFinalize(currencyId: string, responseDecommitment: any): Promise<any> {
    if (!this._currencies.get(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    return await currency.syncFinalize(responseDecommitment);
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

  public async startSync(sessionId: Buffer, currencyId: string, initialCommitment: any): Promise<any> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(stringId).startSync(currencyId, initialCommitment);
  }

  public async syncReveal(sessionId: Buffer, currencyId: string, initialDecommitment: any): Promise<any> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(stringId).syncReveal(currencyId, initialDecommitment);
  }

  public async syncResponse(sessionId: Buffer, currencyId: string, responseCommitment: any): Promise<any> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(stringId).syncResponse(currencyId, responseCommitment);
  }

  public async syncFinalize(sessionId: Buffer, currencyId: string, responseDecommitment: any): Promise<any> {
    const stringId = sessionId.toString('hex');

    if (!this.sessions.has(stringId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(stringId).syncFinalize(currencyId, responseDecommitment);
  }
}
