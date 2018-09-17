import { Injectable, NgZone } from '@angular/core';
import { DistributedEcdsaKeyShard } from 'crypto-core-async';
import { Cryptosystem, CurrencyId, CurrencyInfoService } from './currencyinfo.service';
import { KeyChainService } from './keychain.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { WorkerService } from './worker.service';

import BN from 'bn.js';

import { CurrencyModel, SyncState } from './wallet/wallet';
import { map } from 'rxjs/operators';

export abstract class Currency {
  public state = new BehaviorSubject<SyncState>(SyncState.None);

  public get id(): CurrencyId {
    return this._id;
  }

  public constructor(
    protected readonly _id: CurrencyId
  ) {}

  public abstract compoundPublic(): any;

  public abstract async reset(): Promise<void>;
}

export class EcdsaCurrency extends Currency {
  private _distributedKeyShard: any = null;
  private _syncSessionShard: any = null;

  private _signSessions = new Map<string, any>();

  private _acceptHandler: (model: CurrencyModel, address: string, value: BN, fee: BN) => Promise<boolean> = null;

  public compoundPublic(): any {
    return this._distributedKeyShard ? this._distributedKeyShard.compoundPublic() : null;
  }

  public constructor(
    _id: CurrencyId,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService,
    private readonly _workerService: WorkerService,
    private readonly _ngZone: NgZone
  ) {
    super(_id);
  }

  public setAcceptHandler(acceptHandler: (model: CurrencyModel, address: string, value: BN, fee: BN) => Promise<boolean>): void {
    this._acceptHandler = acceptHandler;
  }

  private async requestAccept(tokenId: string, transaction: any): Promise<boolean> {
    const outputs = await transaction.totalOutputs();

    const fee = await transaction.estimateFee();

    const address = outputs.outputs[0].address;
    const value = outputs.outputs[0].value;

    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    let model;
    if (tokenId) {
      const tokenInfo = currencyInfo.tokens.find((info) => info.id === tokenId);
      model = CurrencyModel.fromToken(currencyInfo, tokenInfo);
    } else {
      model = CurrencyModel.fromCoin(currencyInfo);
    }

    return await this._ngZone.run(async () => await this._acceptHandler(model, address, value, fee));
  }

  public async startSync(initialCommitment: any): Promise<any> {
    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const privateBytes = this._keyChainService.privateBytes(currencyInfo.derivationNumber, 1);

    this._distributedKeyShard = await DistributedEcdsaKeyShard.fromOptions({
      curve: currencyInfo.curve,
      secret: privateBytes
    }, this._workerService.worker);

    this._syncSessionShard = await this._distributedKeyShard.startSyncSession();

    const initialData = await this._syncSessionShard.processInitialCommitment(initialCommitment);

    this._ngZone.run(() => this.state.next(SyncState.Started));

    return initialData;
  }

  public async syncReveal(initialDecommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Started) {
      throw new Error('Invalid session state');
    }

    const challengeCommitment = await this._syncSessionShard.processInitialDecommitment(initialDecommitment);

    this._ngZone.run(() => this.state.next(SyncState.Revealed));

    return challengeCommitment;
  }

  public async syncResponse(responseCommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Revealed) {
      throw new Error('Invalid session state');
    }

    const challengeDecommitment = await this._syncSessionShard.processResponseCommitment(responseCommitment);

    this._ngZone.run(() => this.state.next(SyncState.Responded));

    return challengeDecommitment;
  }

  public async syncFinalize(responseDecommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Responded) {
      throw new Error('Invalid session state');
    }

    const shardSyncData = await this._syncSessionShard.processResponseDecommitment(responseDecommitment);

    await this._distributedKeyShard.importSyncData(shardSyncData);

    this._ngZone.run(() => this.state.next(SyncState.Finalized));

    return;
  }

  public async startSign(signSessionId: string, tokenId: string, transactionBytes: Buffer, entropyCommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Finalized) {
      throw new Error('Invalid session state');
    }

    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const transaction = await currencyInfo.transactionType.fromBytes(transactionBytes, this._workerService.worker);

    if (!await this.requestAccept(tokenId, transaction)) {
      throw new Error('Rejected');
    }

    const signSessionShard = await transaction.startSignSessionShard(this._distributedKeyShard);

    const entropyData = await signSessionShard.processEntropyCommitment(entropyCommitment);

    this._signSessions.set(signSessionId, signSessionShard);

    return entropyData;
  }

  public async signReveal(signSessionId: string, entropyDecommitment: any): Promise<any> {
    if (!this._signSessions.has(signSessionId)) {
      throw new Error('Invalid session state');
    }

    const signSessionShard = this._signSessions.get(signSessionId);

    const partialSignature = signSessionShard.processEntropyDecommitment(entropyDecommitment);

    this._signSessions.delete(signSessionId);

    return partialSignature;
  }

  public async reset(): Promise<void> {
    this.state.next(SyncState.None);
    this._distributedKeyShard = null;
    this._syncSessionShard = null;
    this._signSessions.clear();
  }
}

export class DeviceSession {
  private _currencies = new Map<CurrencyId, Currency>();
  private _activities = new BehaviorSubject<number>(0);

  public currencyEvent = new Subject<Currency>();
  public active = this._activities.pipe(map((activities) => activities > 0));

  private _acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN) => Promise<boolean> = null;

  public setAcceptHandler(
    acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN) => Promise<boolean>
  ): void {
    this._acceptHandler = acceptHandler;
  }

  public get id(): string {
    return this._id;
  }

  public get deviceInfo(): any {
    return this._deviceInfo;
  }

  public get currencies(): Array<Currency> {
    return Array.from(this._currencies.values());
  }

  public currency(currenyId: CurrencyId): Currency {
    return this._currencies.get(currenyId);
  }

  private activityUp() {
    this._ngZone.run(() => this._activities.next(this._activities.getValue() + 1));
  }

  private activityDown() {
    this._ngZone.run(() => this._activities.next(this._activities.getValue() - 1));
  }

  public constructor(
    private readonly _id: string,
    private readonly _deviceInfo: any,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService,
    private readonly _workerService: WorkerService,
    private readonly _ngZone: NgZone
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
    this.activityUp();

    if (!this._currencies.has(currencyId)) {
      return SyncState.None;
    }

    const state = this._currencies.get(currencyId).state.getValue();

    this.activityDown();
    return state;
  }

  public async syncStatus(): Promise<Array<{ currencyId: CurrencyId, state: SyncState }>> {
    this.activityUp();

    const status = Array.from(this._currencies.values()).map((currency) => {
      return {
        currencyId: currency.id,
        state: currency.state.getValue()
      };
    });

    this.activityDown();
    return status;
  }

  public async startEcdsaSync(currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    this.activityUp();

    const currencyInfo = this._currencyInfoService.currencyInfo(currencyId);

    if (currencyInfo.cryptosystem !== Cryptosystem.Ecdsa) {
      throw new Error('Invalid cryptosystem for this currency');
    }

    const currency = new EcdsaCurrency(
      currencyId,
      this._currencyInfoService,
      this._keyChainService,
      this._workerService,
      this._ngZone
    );
    currency.setAcceptHandler(async (model, address, value, fee) => {
      return await this._acceptHandler(this.id, model, address, value, fee);
    });

    this._currencies.set(currencyId, currency);

    this.currencyEvent.next(currency);

    const initialData = await currency.startSync(initialCommitment);

    this.activityDown();
    return initialData;
  }

  public async ecdsaSyncReveal(currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    this.activityUp();

    const currency = this.safeGetEcdsa(currencyId);

    const challengeCommitment = await currency.syncReveal(initialDecommitment);

    this.activityDown();
    return challengeCommitment;
  }

  public async ecdsaSyncResponse(currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    this.activityUp();

    const currency = this.safeGetEcdsa(currencyId);

    const challengeDecommitment = await currency.syncResponse(responseCommitment);

    this.activityDown();
    return challengeDecommitment;
  }

  public async ecdsaSyncFinalize(currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    this.activityUp();

    const currency = this.safeGetEcdsa(currencyId);

    const finalize = await currency.syncFinalize(responseDecommitment);

    this.activityDown();
    return finalize;
  }

  public async startEcdsaSign(
    currencyId: CurrencyId,
    tokenId: string,
    signSessionId: string,
    transactionBytes: Buffer,
    entropyCommitment: any
  ): Promise<any> {
    this.activityUp();

    const currency = this.safeGetEcdsa(currencyId);

    const entropyData = await currency.startSign(signSessionId, tokenId, transactionBytes, entropyCommitment);

    this.activityDown();
    return entropyData;
  }

  public async ecdsaSignReveal(currencyId: CurrencyId, signSessionId: string, entropyDecommitment: any): Promise<any> {
    this.activityUp();

    const currency = this.safeGetEcdsa(currencyId);

    const partialSignature = await currency.signReveal(signSessionId, entropyDecommitment);

    this.activityDown();
    return partialSignature;
  }

  public async reset() {
    const currencies = Array.from(this.currencies.values());

    for (const currency of currencies) {
      await currency.reset();
    }

    this._currencies.clear();
  }
}

@Injectable()
export class VerifierService {
  private _sessions = new Map<string, DeviceSession>();

  public sessionEvent = new Subject<DeviceSession>();

  private _acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN) => Promise<boolean> = null;

  public setAcceptHandler(
    acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN) => Promise<boolean>
  ): void {
    this._acceptHandler = acceptHandler;
  }

  public session(sessionId: string): DeviceSession {
    return this._sessions.get(sessionId);
  }

  public constructor(
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService,
    private readonly _workerService: WorkerService,
    private readonly _ngZone: NgZone
  ) {}

  /**
   * Checks if this session Id is registered and registers it otherwise
   * @param sessionId session Id of the main device
   */
  public async registerSession(sessionId: string, deviceInfo: any): Promise<boolean> {
    if (this._sessions.has(sessionId)) {
      return true;
    }

    const deviceSession = new DeviceSession(
      sessionId,
      deviceInfo,
      this._currencyInfoService,
      this._keyChainService,
      this._workerService,
      this._ngZone
    );
    deviceSession.setAcceptHandler(this._acceptHandler);

    this._sessions.set(sessionId, deviceSession);

    this.sessionEvent.next(deviceSession);

    return false;
  }

  /**
   * Checks if this session Id is registered and removes it
   * @param sessionId session Id of the main device
   */
  public async clearSession(sessionId: string): Promise<boolean> {
    if (!this._sessions.has(sessionId)) {
      return false;
    }

    this._sessions.get(sessionId).reset();

    this._sessions.delete(sessionId);

    return true;
  }

  public async syncState(sessionId: string, currencyId: CurrencyId): Promise<SyncState> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).syncState(currencyId);
  }

  public async syncStatus(sessionId: string): Promise<Array<{ currencyId: CurrencyId, state: SyncState }>> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).syncStatus();
  }

  public async startEcdsaSync(sessionId: string, currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).startEcdsaSync(currencyId, initialCommitment);
  }

  public async ecdsaSyncReveal(sessionId: string, currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).ecdsaSyncReveal(currencyId, initialDecommitment);
  }

  public async ecdsaSyncResponse(sessionId: string, currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).ecdsaSyncResponse(currencyId, responseCommitment);
  }

  public async ecdsaSyncFinalize(sessionId: string, currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).ecdsaSyncFinalize(currencyId, responseDecommitment);
  }

  public async startEcdsaSign(
    sessionId: string,
    currencyId: CurrencyId,
    tokenId: string,
    signSessionId: string,
    transactionBytes: Buffer,
    entropyCommitment: any
  ): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).startEcdsaSign(currencyId, tokenId, signSessionId, transactionBytes, entropyCommitment);
  }

  public async ecdsaSignReveal(
    sessionId: string,
    currencyId: CurrencyId,
    signSessionId: string,
    entropyDecommitment: any
  ): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).ecdsaSignReveal(currencyId, signSessionId, entropyDecommitment);
  }

  public async reset() {
    const sessions = Array.from(this._sessions.values());

    for (const session of sessions) {
      await session.reset();
    }

    this._sessions.clear();
  }
}
