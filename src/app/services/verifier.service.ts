import { Injectable } from '@angular/core';

import { DistributedEcdsaKeyShard, Curve } from 'crypto-core-async';
import { CurrencyInfoService, CurrencyId } from './currencyinfo.service';
import { KeyChainService } from './keychain.service';

export enum SyncState {
  None = 0,
  Started = 1,
  Revealed = 2,
  Responded = 3,
  Finalized = 4,
}

export class Currency {
  private _state: SyncState = SyncState.None;
  private _distributedKeyShard: any;
  private _syncSessionShard: any;

  public get id(): CurrencyId {
    return this._id;
  }

  public get state(): SyncState {
    return this._state;
  }

  public constructor(
    private readonly _id: CurrencyId,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService
  ) {}

  public async startSync(initialCommitment: any): Promise<any> {
    const derivationNumber = this._currencyInfoService.currencyInfo(this.id).derivationNumber;
    const privateBytes = this._keyChainService.privateBytes(derivationNumber, 0);

    this._distributedKeyShard = await DistributedEcdsaKeyShard.fromOptions({
      curve: Curve.secp256k1,
      secret: privateBytes
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
  private _currencies = new Map<CurrencyId, Currency>();

  public get id(): string {
    return this._id;
  }

  public get currencies(): Array<Currency> {
    return Array.from(this._currencies.values());
  }

  public constructor(
    private readonly _id: string,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService
  ) {}

  public async syncState(currencyId: CurrencyId): Promise<SyncState> {
    if (!this._currencies.has(currencyId)) {
      return SyncState.None;
    }

    return this._currencies.get(currencyId).state;
  }

  public async syncStatus(): Promise<Array<{ currencyId: CurrencyId, state: SyncState }>> {
    return Array.from(this._currencies.values()).map((currency) => {
      return {
        currencyId: currency.id,
        state: currency.state
      };
    });
  }

  public async startSync(currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    const currency = new Currency(currencyId, this._currencyInfoService, this._keyChainService);

    this._currencies.set(currencyId, currency);

    return await currency.startSync(initialCommitment);
  }

  public async syncReveal(currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    if (!this._currencies.has(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    return await currency.syncReveal(initialDecommitment);
  }

  public async syncResponse(currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    if (!this._currencies.has(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    return await currency.syncResponse(responseCommitment);
  }

  public async syncFinalize(currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    if (!this._currencies.has(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    return await currency.syncFinalize(responseDecommitment);
  }
}

@Injectable()
export class VerifierService {
  private sessions = new Map<string, DeviceSession>();

  public constructor(
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService
  ) {}

  /**
   * Checks if this session Id is registered and registers it otherwise
   * @param sessionId session Id of the main device
   */
  public async registerSession(sessionId: string): Promise<boolean> {
    if (this.sessions.has(sessionId)) {
      return true;
    }

    this.sessions.set(sessionId, new DeviceSession(sessionId, this._currencyInfoService, this._keyChainService));

    return false;
  }

  /**
   * Checks if this session Id is registered and removes it
   * @param sessionId session Id of the main device
   */
  public async clearSession(sessionId: string): Promise<boolean> {
    if (!this.sessions.has(sessionId)) {
      return false;
    }

    this.sessions.delete(sessionId);

    return true;
  }

  public async syncState(sessionId: string, currencyId: CurrencyId): Promise<SyncState> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).syncState(currencyId);
  }

  public async syncStatus(sessionId: string): Promise<Array<{ currencyId: CurrencyId, state: SyncState }>> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).syncStatus();
  }

  public async startSync(sessionId: string, currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).startSync(currencyId, initialCommitment);
  }

  public async syncReveal(sessionId: string, currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).syncReveal(currencyId, initialDecommitment);
  }

  public async syncResponse(sessionId: string, currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).syncResponse(currencyId, responseCommitment);
  }

  public async syncFinalize(sessionId: string, currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).syncFinalize(currencyId, responseDecommitment);
  }
}
