import { Injectable } from '@angular/core';

import { DistributedEcdsaKeyShard, BitcoreEntropyCommitment, BitcoreEntropyDecommitment } from 'crypto-core-async';
import { CurrencyInfoService, CurrencyId, Cryptosystem } from './currencyinfo.service';
import { KeyChainService } from './keychain.service';

export enum SyncState {
  None = 0,
  Started = 1,
  Revealed = 2,
  Responded = 3,
  Finalized = 4,
}

export class Currency {
  protected _state: SyncState = SyncState.None;

  public get id(): CurrencyId {
    return this._id;
  }

  public get state(): SyncState {
    return this._state;
  }

  public constructor(
    protected readonly _id: CurrencyId,
    protected readonly _currencyInfoService: CurrencyInfoService,
    protected readonly _keyChainService: KeyChainService
  ) {}
}

export class EcdsaCurrency extends Currency {
  private _distributedKeyShard: any;
  private _syncSessionShard: any;

  private _signSessions = new Map<string, any>();

  public constructor(
    _id: CurrencyId,
    _currencyInfoService: CurrencyInfoService,
    _keyChainService: KeyChainService
  ) {
    super(_id, _currencyInfoService, _keyChainService);
  }

  public async startSync(initialCommitment: any): Promise<any> {
    const currecyInfo = this._currencyInfoService.currencyInfo(this.id);

    const privateBytes = this._keyChainService.privateBytes(60, 1);

    this._distributedKeyShard = await DistributedEcdsaKeyShard.fromOptions({
      curve: currecyInfo.curve,
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

  public async startSign(signSessionId: string, transactionBytes: Buffer, entropyCommitmentBytes: Buffer): Promise<Buffer> {
    if (this._state !== SyncState.Finalized) {
      throw new Error('Invalid session state');
    }

    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const transaction = await currencyInfo.transactionType.fromBytes(transactionBytes);

    const signSessionShard = await transaction.startSignSessionShard(this._distributedKeyShard);

    const entropyCommitment = BitcoreEntropyCommitment.fromBytes(entropyCommitmentBytes);

    const entropyData = await signSessionShard.processEntropyCommitment(entropyCommitment);

    this._signSessions.set(signSessionId, signSessionShard);

    return entropyData.toBytes();
  }

  public async signReveal(signSessionId: string, entropyDecommitmentBytes: Buffer): Promise<Buffer> {
    if (!this._signSessions.has(signSessionId)) {
      throw new Error('Invalid session state');
    }

    const signSessionShard = this._signSessions.get(signSessionId);

    const entropyDecommitment = BitcoreEntropyDecommitment.fromBytes(entropyDecommitmentBytes);

    const partialSignature = signSessionShard.processEntropyDecommitment(entropyDecommitment);

    this._signSessions.delete(signSessionId);

    return partialSignature.toBytes();
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

  private safeGetEcdsa(currencyId) {
    if (!this._currencies.has(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    if (!(currency instanceof EcdsaCurrency)) {
      throw new Error('Invalid cryptosystem for this currency');
    }

    return currency as EcdsaCurrency;
  }

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

  public async startEcdsaSync(currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    const currecyInfo = this._currencyInfoService.currencyInfo(currencyId);

    if (currecyInfo.cryptosystem !== Cryptosystem.Ecdsa) {
      throw new Error('Invalid cryptosystem for this currency');
    }

    const currency = new EcdsaCurrency(currencyId, this._currencyInfoService, this._keyChainService);

    this._currencies.set(currencyId, currency);

    return await currency.startSync(initialCommitment);
  }

  public async ecdsaSyncReveal(currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    const currency = this.safeGetEcdsa(currencyId);

    return await currency.syncReveal(initialDecommitment);
  }

  public async ecdsaSyncResponse(currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    const currency = this.safeGetEcdsa(currencyId);

    return await currency.syncResponse(responseCommitment);
  }

  public async ecdsaSyncFinalize(currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    const currency = this.safeGetEcdsa(currencyId);

    return await currency.syncFinalize(responseDecommitment);
  }

  public async startEcdsaSign(
    currencyId: CurrencyId,
    signSessionId: string,
    transactionBytes: Buffer,
    entropyCommitmentBytes: Buffer
  ): Promise<Buffer> {
    const currency = this.safeGetEcdsa(currencyId);

    return await currency.startSign(signSessionId, transactionBytes, entropyCommitmentBytes);
  }

  public async ecdsaSignReveal(currencyId: CurrencyId, signSessionId: string, entropyDecommitmentBytes: Buffer): Promise<Buffer> {
    const currency = this.safeGetEcdsa(currencyId);

    return await currency.signReveal(signSessionId, entropyDecommitmentBytes);
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

  public async startEcdsaSync(sessionId: string, currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).startEcdsaSync(currencyId, initialCommitment);
  }

  public async ecdsaSyncReveal(sessionId: string, currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).ecdsaSyncReveal(currencyId, initialDecommitment);
  }

  public async ecdsaSyncResponse(sessionId: string, currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).ecdsaSyncResponse(currencyId, responseCommitment);
  }

  public async ecdsaSyncFinalize(sessionId: string, currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).ecdsaSyncFinalize(currencyId, responseDecommitment);
  }

  public async startEcdsaSign(
    sessionId: string,
    currencyId: CurrencyId,
    signSessionId: string,
    transactionBytes: Buffer,
    entropyCommitmentBytes: Buffer
  ): Promise<Buffer> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).startEcdsaSign(currencyId, signSessionId, transactionBytes, entropyCommitmentBytes);
  }

  public async ecdsaSignReveal(
    sessionId: string,
    currencyId: CurrencyId,
    signSessionId: string,
    entropyDecommitmentBytes: Buffer
  ): Promise<Buffer> {
    if (!this.sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this.sessions.get(sessionId).ecdsaSignReveal(currencyId, signSessionId, entropyDecommitmentBytes);
  }
}
