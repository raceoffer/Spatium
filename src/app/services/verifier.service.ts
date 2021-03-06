import { Injectable } from '@angular/core';
import BN from 'bn.js';
import { DistributedEcdsaKeyShard, DistributedEddsaKey, Marshal } from 'crypto-core-async';
import { BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBehaviourSubject } from '../utils/transformers';
import { Cryptosystem, CurrencyId, CurrencyInfoService } from './currencyinfo.service';
import { KeyChainService } from './keychain.service';
import { CurrencyModel, SyncState } from './wallet/wallet';
import { WorkerService } from './worker.service';

export abstract class Currency {
  public state = new BehaviorSubject<SyncState>(SyncState.None);

  public constructor(protected readonly _id: CurrencyId) {}

  public get id(): CurrencyId {
    return this._id;
  }

  public abstract compoundPublic(): any;

  public async cancelSign(sessionsId: string, signSessionId: string): Promise<any> {}

  public abstract async reset(): Promise<void>;
}

export class EcdsaCurrency extends Currency {
  private _distributedKeyShard: any = null;
  private _syncSessionShard: any = null;

  private _signSessions = new Map<string, any>();

  private _acceptHandler: (model: CurrencyModel, address: string, value: BN, fee: BN, price: string) => Promise<boolean> = null;
  private _cancelHandler: (sessionId: string) => Promise<any> = null;

  public constructor(_id: CurrencyId,
                     private readonly _currencyInfoService: CurrencyInfoService,
                     private readonly _keyChainService: KeyChainService,
                     private readonly _workerService: WorkerService) {
    super(_id);
  }

  public compoundPublic(): any {
    return this._distributedKeyShard ? this._distributedKeyShard.compoundPublic() : null;
  }

  public setAcceptHandler(acceptHandler: (model: CurrencyModel, address: string, value: BN, fee: BN,
                                          price: string) => Promise<boolean>): void {
    this._acceptHandler = acceptHandler;
  }

  public setCancelHandler(cancelHandler: (sessionId: string) => Promise<any>): void {
    this._cancelHandler = cancelHandler;
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

    this.state.next(SyncState.Started);

    return initialData;
  }

  public async syncReveal(initialDecommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Started) {
      throw new Error('Invalid session state');
    }

    const challengeCommitment = await this._syncSessionShard.processInitialDecommitment(initialDecommitment);

    this.state.next(SyncState.Revealed);

    return challengeCommitment;
  }

  public async syncResponse(responseCommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Revealed) {
      throw new Error('Invalid session state');
    }

    const challengeDecommitment = await this._syncSessionShard.processResponseCommitment(responseCommitment);

    this.state.next(SyncState.Responded);

    return challengeDecommitment;
  }

  public async syncFinalize(responseDecommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Responded) {
      throw new Error('Invalid session state');
    }

    const shardSyncData = await this._syncSessionShard.processResponseDecommitment(responseDecommitment);

    await this._distributedKeyShard.importSyncData(shardSyncData);

    this.state.next(SyncState.Finalized);

    return;
  }

  public async startSign(signSessionId: string, tokenId: string, transactionBytes: Buffer, entropyCommitment: any,
                         price: string): Promise<any> {
    if (this.state.getValue() !== SyncState.Finalized) {
      throw new Error('Invalid session state');
    }

    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const transaction = await currencyInfo.transactionType.fromBytes(transactionBytes, this._workerService.worker);

    if (!await this.requestAccept(tokenId, transaction, price)) {
      throw new Error('Rejected');
    }

    const signSessionShard = await transaction.startSignSessionShard(this._distributedKeyShard);

    const entropyData = await signSessionShard.processEntropyCommitment(entropyCommitment);

    this._signSessions.set(signSessionId, signSessionShard);

    return entropyData;
  }

  public async signFinalize(signSessionId: string, entropyDecommitment: any): Promise<any> {
    if (!this._signSessions.has(signSessionId)) {
      throw new Error('Invalid session state');
    }

    const signSessionShard = this._signSessions.get(signSessionId);

    const partialSignature = signSessionShard.processEntropyDecommitment(entropyDecommitment);

    this._signSessions.delete(signSessionId);

    return partialSignature;
  }

  public async cancelSign(sessionsId: string, signSessionId: string): Promise<any> {
    if (this._signSessions.has(signSessionId)) {
      this._signSessions.delete(signSessionId);
    }
    return await this._cancelHandler(sessionsId);
  }

  public async reset(): Promise<void> {
    this.state.next(SyncState.None);
    this._distributedKeyShard = null;
    this._syncSessionShard = null;
    this._signSessions.clear();
  }

  private async requestAccept(tokenId: string, transaction: any, price: string): Promise<boolean> {
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

    return await this._acceptHandler(model, address, value, fee, price);
  }
}

export class EddsaCurrency extends Currency {
  private _distributedKeyShard: any = null;
  private _syncSessionShard: any = null;

  private _signSessions = new Map<string, any>();

  private _acceptHandler: (model: CurrencyModel, address: string, value: BN, fee: BN, price: string) => Promise<boolean> = null;
  private _cancelHandler: (sessionId: string) => Promise<any> = null;

  public constructor(_id: CurrencyId,
                     private readonly _currencyInfoService: CurrencyInfoService,
                     private readonly _keyChainService: KeyChainService,
                     private readonly _workerService: WorkerService) {
    super(_id);
  }

  public compoundPublic(): any {
    return this._distributedKeyShard ? this._distributedKeyShard.compoundPublic() : null;
  }

  public setAcceptHandler(acceptHandler: (model: CurrencyModel, address: string, value: BN, fee: BN,
                                          price: string) => Promise<boolean>): void {
    this._acceptHandler = acceptHandler;
  }

  public setCancelHandler(cancelHandler: (sessionId: string) => Promise<any>): void {
    this._cancelHandler = cancelHandler;
  }

  public async startSync(commitment: any): Promise<any> {
    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const privateBytes = this._keyChainService.privateBytes(currencyInfo.derivationNumber, 1);

    this._distributedKeyShard = await DistributedEddsaKey.fromOptions({
      curve: currencyInfo.curve,
      secret: privateBytes
    }, this._workerService.worker);

    this._syncSessionShard = await this._distributedKeyShard.startSyncSessionShard();

    const data = await this._syncSessionShard.processCommitment(commitment);

    this.state.next(SyncState.Started);

    return data;
  }

  public async syncFinalize(decommitment: any): Promise<any> {
    if (this.state.getValue() !== SyncState.Started) {
      throw new Error('Invalid session state');
    }

    const shardSyncData = await this._syncSessionShard.processDecommitment(decommitment);

    await this._distributedKeyShard.importSyncData(shardSyncData);

    this.state.next(SyncState.Finalized);

    return;
  }

  public async startSign(signSessionId: string, tokenId: string, transactionBytes: Buffer, entropyCommitment: any,
                         price: string): Promise<any> {
    if (this.state.getValue() !== SyncState.Finalized) {
      throw new Error('Invalid session state');
    }

    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const transaction = await currencyInfo.transactionType.fromBytes(transactionBytes, this._workerService.worker);

    if (!await this.requestAccept(tokenId, transaction, price)) {
      throw new Error('Rejected');
    }

    const signSessionShard = await transaction.startSignSessionShard(this._distributedKeyShard);

    const entropyData = await signSessionShard.processEntropyCommitment(entropyCommitment);

    this._signSessions.set(signSessionId, signSessionShard);

    return entropyData;
  }

  public async signFinalize(signSessionId: string, entropyDecommitment: any): Promise<any> {
    if (!this._signSessions.has(signSessionId)) {
      throw new Error('Invalid session state');
    }

    const signSessionShard = this._signSessions.get(signSessionId);

    const partialSignature = signSessionShard.processEntropyDecommitment(entropyDecommitment);

    this._signSessions.delete(signSessionId);

    return partialSignature;
  }

  public async cancelSign(sessionId: string, signSessionId: string): Promise<any> {
    if (this._signSessions.has(signSessionId)) {
      this._signSessions.delete(signSessionId);
    }
    return await this._cancelHandler(sessionId);
  }

  public async reset(): Promise<void> {
    this.state.next(SyncState.None);
    this._distributedKeyShard = null;
    this._syncSessionShard = null;
    this._signSessions.clear();
  }

  private async requestAccept(tokenId: string, transaction: any, price: string): Promise<boolean> {
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

    return await this._acceptHandler(model, address, value, fee, price);
  }
}

export class DeviceSession {
  public currencyEvent = new Subject<Currency>();
  private _activities = new BehaviorSubject<number>(0);
  public active = toBehaviourSubject(this._activities.pipe(map((activities) => activities > 0)), false);
  private _acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN,
                           price: string) => Promise<boolean> = null;
  private _cancelHandler: (signSessionId: string) => Promise<any> = null;

  public constructor(private readonly _id: string,
                     private readonly _deviceInfo: any,
                     private readonly _currencyInfoService: CurrencyInfoService,
                     private readonly _keyChainService: KeyChainService,
                     private readonly _workerService: WorkerService) {}

  private _currencies = new Map<CurrencyId, Currency>();

  public get currencies(): Array<Currency> {
    return Array.from(this._currencies.values());
  }

  public get id(): string {
    return this._id;
  }

  public get deviceInfo(): any {
    return this._deviceInfo;
  }

  public setAcceptHandler(acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN,
                                          price: string) => Promise<boolean>): void {
    this._acceptHandler = acceptHandler;
  }

  public setCancelHandler(cancelHandler: (signSessionId: string) => Promise<any>): void {
    this._cancelHandler = cancelHandler;
  }

  public currency(currenyId: CurrencyId): Currency {
    return this._currencies.get(currenyId);
  }

  public async syncState(currencyId: CurrencyId): Promise<SyncState> {
    this.activityStart();

    try {
      if (!this._currencies.has(currencyId)) {
        return SyncState.None;
      }

      return this._currencies.get(currencyId).state.getValue();
    } finally {
      this.activityEnd();
    }
  }

  public async syncStatus(): Promise<Array<{ currencyId: CurrencyId, state: SyncState }>> {
    this.activityStart();

    try {
      return Array.from(this._currencies.values()).map((currency) => {
        return {
          currencyId: currency.id,
          state: currency.state.getValue()
        };
      });
    } finally {
      this.activityEnd();
    }
  }

  public async startEcdsaSync(currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currencyInfo = this._currencyInfoService.currencyInfo(currencyId);

      if (currencyInfo.cryptosystem !== Cryptosystem.Ecdsa) {
        throw new Error('Invalid cryptosystem for this currency');
      }

      const currency = new EcdsaCurrency(
        currencyId,
        this._currencyInfoService,
        this._keyChainService,
        this._workerService
      );

      currency.setAcceptHandler(async (model, address, value, fee, price) => {
        return await this._acceptHandler(this.id, model, address, value, fee, price);
      });

      currency.setCancelHandler(async (signSessionId) => {
        return await this._cancelHandler(signSessionId);
      });

      this._currencies.set(currencyId, currency);

      this.currencyEvent.next(currency);

      return await currency.startSync(initialCommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async ecdsaSyncReveal(currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EcdsaCurrency);

      return await currency.syncReveal(initialDecommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async ecdsaSyncResponse(currencyId: CurrencyId, responseCommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EcdsaCurrency);

      return await currency.syncResponse(responseCommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async ecdsaSyncFinalize(currencyId: CurrencyId, responseDecommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EcdsaCurrency);
      return await currency.syncFinalize(responseDecommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async startEcdsaSign(currencyId: CurrencyId,
                              tokenId: string,
                              signSessionId: string,
                              transactionBytes: Buffer,
                              entropyCommitment: any,
                              price: string): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EcdsaCurrency);

      return await currency.startSign(signSessionId, tokenId, transactionBytes, entropyCommitment,
        price);
    } finally {
      this.activityEnd();
    }
  }

  public async ecdsaSignFinalize(currencyId: CurrencyId, signSessionId: string, entropyDecommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EcdsaCurrency);

      return await currency.signFinalize(signSessionId, entropyDecommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async startEddsaSync(currencyId: CurrencyId, commitment: any): Promise<any> {
    this.activityStart();

    try {
      const currencyInfo = this._currencyInfoService.currencyInfo(currencyId);

      if (currencyInfo.cryptosystem !== Cryptosystem.Eddsa) {
        throw new Error('Invalid cryptosystem for this currency');
      }

      const currency = new EddsaCurrency(
        currencyId,
        this._currencyInfoService,
        this._keyChainService,
        this._workerService
      );

      currency.setAcceptHandler(async (model, address, value, fee, price) => {
        return await this._acceptHandler(this.id, model, address, value, fee, price);
      });

      currency.setCancelHandler(async (signSessionId) => {
        return await this._cancelHandler(signSessionId);
      });

      this._currencies.set(currencyId, currency);

      this.currencyEvent.next(currency);

      return await currency.startSync(commitment);
    } finally {
      this.activityEnd();
    }
  }

  public async eddsaSyncFinalize(currencyId: CurrencyId, decommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EddsaCurrency);

      return await currency.syncFinalize(decommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async startEddsaSign(currencyId: CurrencyId,
                              tokenId: string,
                              signSessionId: string,
                              transactionBytes: Buffer,
                              entropyCommitment: any,
                              price: string): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EddsaCurrency);

      return await currency.startSign(signSessionId, tokenId, transactionBytes, entropyCommitment,
        price);
    } finally {
      this.activityEnd();
    }
  }

  public async eddsaSignFinalize(currencyId: CurrencyId, signSessionId: string, entropyDecommitment: any): Promise<any> {
    this.activityStart();

    try {
      const currency = this.safeGetAs(currencyId, EddsaCurrency);

      return await currency.signFinalize(signSessionId, entropyDecommitment);
    } finally {
      this.activityEnd();
    }
  }

  public async cancelSign(sessionId: string, currencyId: CurrencyId, signSessionId: string): Promise<any> {
    this.activityStart();

    try {
      const currency = this._currencies.get(currencyId);
      return await currency.cancelSign(sessionId, signSessionId);
    } finally {
      this.activityEnd();
    }
  }

  public async reset() {
    const currencies = Array.from(this.currencies.values());

    for (const currency of currencies) {
      await currency.reset();
    }

    this._currencies.clear();
  }

  private activityStart() {
    this._activities.next(this._activities.getValue() + 1);
  }

  private activityEnd() {
    this._activities.next(this._activities.getValue() - 1);
  }

  private safeGetAs<T>(currencyId: CurrencyId, C: { new(...args: any[]): T }) {
    if (!this._currencies.has(currencyId)) {
      throw new Error('Sync session not started');
    }

    const currency = this._currencies.get(currencyId);

    if (!(currency instanceof C)) {
      throw new Error('Invalid cryptosystem for this currency');
    }

    return currency as T;
  }
}

@Injectable()
export class VerifierService {
  public sessionEvent = new Subject<string>();
  private _acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN,
                           price: string) => Promise<boolean> = null;
  private _cancelHandler: (sessionId: string) => Promise<any> = null;

  public constructor(private readonly _currencyInfoService: CurrencyInfoService,
                     private readonly _keyChainService: KeyChainService,
                     private readonly _workerService: WorkerService) {}

  private _sessions = new Map<string, DeviceSession>();

  public get sessions(): Array<DeviceSession> {
    return Array.from(this._sessions.values());
  }

  public setAcceptHandler(acceptHandler: (sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN,
                                          price: string) => Promise<boolean>): void {
    this._acceptHandler = acceptHandler;
  }

  public setCancelHandler(cancelHandler: (sessionId: string) => Promise<any>): void {
    this._cancelHandler = cancelHandler;
  }

  public session(sessionId: string): DeviceSession {
    return this._sessions.get(sessionId);
  }

  /**
   * Checks if this session Id is registered and registers it otherwise
   * @param sessionId session Id of the main device
   */
  public async registerSession(sessionId: string, deviceInfo: any): Promise<boolean> {
    if (this._sessions.has(sessionId)) {
      return true;
    }

    const oldSessions =
      Array.from(this._sessions.values())
        .filter(session => session.deviceInfo.id === deviceInfo.id)
        .map(session => session.id);

    for (const oldSession of oldSessions) {
      await this.clearSession(oldSession);
    }

    const deviceSession = new DeviceSession(
      sessionId,
      deviceInfo,
      this._currencyInfoService,
      this._keyChainService,
      this._workerService
    );
    deviceSession.setAcceptHandler(this._acceptHandler);
    deviceSession.setCancelHandler(this._cancelHandler);

    this._sessions.set(sessionId, deviceSession);

    this.sessionEvent.next(sessionId);

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

    this.sessionEvent.next(sessionId);

    return true;
  }

  public async syncState(sessionId: string, currencyId: CurrencyId): Promise<SyncState> {
    if (!this._sessions.has(sessionId)) {
      return SyncState.None;
    }

    return await this._sessions.get(sessionId).syncState(currencyId);
  }

  public async syncStatus(sessionId: string): Promise<Array<{ currencyId: CurrencyId, state: SyncState }>> {
    if (!this._sessions.has(sessionId)) {
      return [];
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

  public async startEcdsaSign(sessionId: string,
                              currencyId: CurrencyId,
                              tokenId: string,
                              signSessionId: string,
                              transactionBytes: Buffer,
                              entropyCommitment: any,
                              price: string): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).startEcdsaSign(currencyId, tokenId, signSessionId, transactionBytes,
      entropyCommitment, price);
  }

  public async ecdsaSignFinalize(sessionId: string,
                                 currencyId: CurrencyId,
                                 signSessionId: string,
                                 entropyDecommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).ecdsaSignFinalize(currencyId, signSessionId, entropyDecommitment);
  }

  public async startEddsaSync(sessionId: string, currencyId: CurrencyId, initialCommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).startEddsaSync(currencyId, initialCommitment);
  }

  public async eddsaSyncFinalize(sessionId: string, currencyId: CurrencyId, initialDecommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).eddsaSyncFinalize(currencyId, initialDecommitment);
  }

  public async startEddsaSign(sessionId: string,
                              currencyId: CurrencyId,
                              tokenId: string,
                              signSessionId: string,
                              transactionBytes: Buffer,
                              entropyCommitment: any,
                              price: string): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).startEddsaSign(currencyId, tokenId, signSessionId, transactionBytes,
      entropyCommitment, price);
  }

  public async eddsaSignFinalize(sessionId: string,
                                 currencyId: CurrencyId,
                                 signSessionId: string,
                                 entropyDecommitment: any): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).eddsaSignFinalize(currencyId, signSessionId, entropyDecommitment);
  }

  public async cancelSign(sessionId: string,
                          currencyId: CurrencyId,
                          signSessionId: string): Promise<any> {
    if (!this._sessions.has(sessionId)) {
      throw new Error('Unknown session id');
    }

    return await this._sessions.get(sessionId).cancelSign(sessionId, currencyId, signSessionId);
  }

  public async reset() {
    const sessions = Array.from(this._sessions.values());

    this._sessions.clear();

    for (const session of sessions) {
      await session.reset();
      this.sessionEvent.next(session.id);
    }
  }
}
