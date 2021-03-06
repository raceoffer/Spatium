import { Injectable } from '@angular/core';
import { CurrencyInfoService, CurrencyId, Cryptosystem } from './currencyinfo.service';
import { KeyChainService } from './keychain.service';
import { Currency } from './verifier.service';

import {
  DistributedEcdsaKey,
  DistributedEddsaKey,
  EcdsaInitialData,
  EcdsaChallengeCommitment,
  EcdsaChallengeDecommitment,
  EddsaData
} from 'crypto-core-async';

import { ReplaySubject, Subject, BehaviorSubject } from 'rxjs';
import { waitFiorPromise, waitForSubject } from '../utils/transformers';
import { RPCClient } from './rpc/rpc-client';
import { WorkerService } from './worker.service';
import { SyncState } from './wallet/wallet';
import { DeviceService } from './device.service';
import { requestDialog } from '../utils/dialog';
import { NotificationService } from './notification.service';

export class EcdsaCurrency extends Currency {
  private _distributedKey: any = null;
  private _cancelSubject = new ReplaySubject<any>(1);

  public get distributedKey(): any {
    return this._distributedKey;
  }

  public compoundPublic(): any {
    return this._distributedKey ? this._distributedKey.compoundPublic() : null;
  }

  public constructor(
    _id: CurrencyId,
    private _sessionId: string,
    private _paillierPublicKey: any,
    private _paillierSecretKey: any,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService,
    private readonly _workerService: WorkerService
  ) {
    super(_id);
  }

  public async sync(rpcClient: RPCClient): Promise<boolean> {
    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const privateBytes = this._keyChainService.privateBytes(currencyInfo.derivationNumber, 1);

    this._distributedKey = await DistributedEcdsaKey.fromOptions({
      curve: currencyInfo.curve,
      secret: privateBytes,
      localPaillierPublicKey: this._paillierPublicKey,
      localPaillierSecretKey: this._paillierSecretKey,
    }, this._workerService.worker);

    const syncSession = await this._distributedKey.startSyncSession();

    const initialCommitment = await syncSession.createInitialCommitment();

    this.state.next(SyncState.Started);

    const startSyncResponse = await waitFiorPromise<any>(rpcClient.api.startEcdsaSync({
      sessionId: this._sessionId,
      currencyId: this.id,
      initialCommitment: initialCommitment.toJSON()
    }), this._cancelSubject);
    console.log(startSyncResponse);
    if (!startSyncResponse) {
      return false;
    }

    const initialData = EcdsaInitialData.fromJSON(startSyncResponse.initialData);

    const initialDecommitment = await syncSession.processInitialData(initialData);

    this.state.next(SyncState.Revealed);

    const syncRevealResponse = await waitFiorPromise<any>(rpcClient.api.ecdsaSyncReveal({
      sessionId: this._sessionId,
      currencyId: this.id,
      initialDecommitment: initialDecommitment.toJSON()
    }), this._cancelSubject);
    console.log(syncRevealResponse);
    if (!syncRevealResponse) {
      return false;
    }

    const challengeCommitment = EcdsaChallengeCommitment.fromJSON(syncRevealResponse.challengeCommitment);

    const responseCommitment = await syncSession.processChallengeCommitment(challengeCommitment);

    this.state.next(SyncState.Responded);

    const syncResponseResponse = await waitFiorPromise<any>(rpcClient.api.ecdsaSyncResponse({
      sessionId: this._sessionId,
      currencyId: this.id,
      responseCommitment: responseCommitment.toJSON()
    }), this._cancelSubject);
    console.log(syncResponseResponse);
    if (!syncResponseResponse) {
      return false;
    }

    const challengeDecommitment = EcdsaChallengeDecommitment.fromJSON(syncResponseResponse.challengeDecommitment);

    const { responseDecommitment, syncData } = await syncSession.processChallengeDecommitment(challengeDecommitment);

    const syncFinalizeResponse = await waitFiorPromise<any>(rpcClient.api.ecdsaSyncFinalize({
      sessionId: this._sessionId,
      currencyId: this.id,
      responseDecommitment: responseDecommitment.toJSON()
    }), this._cancelSubject);
    console.log(syncFinalizeResponse);
    if (!syncFinalizeResponse) {
      return false;
    }

    await this._distributedKey.importSyncData(syncData);

    this.state.next(SyncState.Finalized);

    return true;
  }

  public cancel() {
    this._cancelSubject.next();
  }

  public async reset(): Promise<void> {
    this.state.next(SyncState.None);
    this._distributedKey = null;
  }
}

export class EddsaCurrency extends Currency {
  private _distributedKey: any = null;
  private _cancelSubject = new ReplaySubject<any>(1);

  public get distributedKey(): any {
    return this._distributedKey;
  }

  public compoundPublic(): any {
    return this._distributedKey ? this._distributedKey.compoundPublic() : null;
  }

  public constructor(
    _id: CurrencyId,
    private _sessionId: string,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService,
    private readonly _workerService: WorkerService
  ) {
    super(_id);
  }

  public async sync(rpcClient: RPCClient): Promise<boolean> {
    const currencyInfo = this._currencyInfoService.currencyInfo(this.id);

    const privateBytes = this._keyChainService.privateBytes(currencyInfo.derivationNumber, 1);

    this._distributedKey = await DistributedEddsaKey.fromOptions({
      curve: currencyInfo.curve,
      secret: privateBytes,
    }, this._workerService.worker);

    const syncSession = await this._distributedKey.startSyncSession();

    const commitment = await syncSession.createCommitment();

    this.state.next(SyncState.Started);

    const startSyncResponse = await waitFiorPromise<any>(rpcClient.api.startEddsaSync({
      sessionId: this._sessionId,
      currencyId: this.id,
      commitment: commitment.toJSON()
    }), this._cancelSubject);
    console.log(startSyncResponse);
    if (!startSyncResponse) {
      return false;
    }

    const data = EddsaData.fromJSON(startSyncResponse.data);

    const { decommitment, syncData } = await syncSession.processData(data);

    this.state.next(SyncState.Revealed);

    const syncFinalizeResponse = await waitFiorPromise<any>(rpcClient.api.eddsaSyncFinalize({
      sessionId: this._sessionId,
      currencyId: this.id,
      decommitment: decommitment.toJSON()
    }), this._cancelSubject);
    console.log(syncFinalizeResponse);
    if (!syncFinalizeResponse) {
      return false;
    }

    await this._distributedKey.importSyncData(syncData);

    this.state.next(SyncState.Finalized);

    return true;
  }

  public cancel() {
    this._cancelSubject.next();
  }

  public async reset(): Promise<void> {
    this.state.next(SyncState.None);
    this._distributedKey = null;
  }
}

@Injectable()
export class SyncService {
  private _syncQueue = [];

  private _currencies = new Map<CurrencyId, Currency>();

  private _cancelSubject = new Subject<any>();
  private _cancelled = false;
  private _currentPeerId = null;

  public synchronizing = new BehaviorSubject<boolean>(false);
  public resynchronizing = new BehaviorSubject<boolean>(false);

  public currencyEvent = new Subject<CurrencyId>();

  public resyncEvent = new Subject<void>();

  public resetEvent = new Subject<void>();

  public currency(currencyId: CurrencyId): Currency {
    return this._currencies.has(currencyId) ? this._currencies.get(currencyId) : null;
  }

  public get currentPeerId(): string {
    return this._currentPeerId;
  }

  public get currencies(): Array<Currency> {
    return Array.from(this._currencies.values());
  }

  constructor(
    private readonly _deviceService: DeviceService,
    private readonly _currencyInfoService: CurrencyInfoService,
    private readonly _keyChainService: KeyChainService,
    private readonly _workerService: WorkerService,
    private readonly _notificationService: NotificationService
  ) {}

  public async sync(
    sessionId: string,
    paillierPublicKey: any,
    paillierSecretKey: any,
    rpcClient: RPCClient,
    startWith: CurrencyId = null,
    isReseted: boolean = false
  ): Promise<boolean> {
    if (this.synchronizing.getValue()) {
      await this.cancel();
    }

    this.synchronizing.next(true);

    try {
      this._cancelled = false;

      const capabilities = await waitFiorPromise<any>(rpcClient.api.capabilities({}), this._cancelSubject);
      console.log(capabilities);
      if (!capabilities) {
        return false;
      }

      const appInfo: any = await this._deviceService.appInfo();
      const deviceInfo: any = await this._deviceService.deviceInfo();
      const version = appInfo.version.match(/^(\d+)\.(\d+)\.(\d+)(\.\d+)?$/);

      const handshakeResponse = await waitFiorPromise<any>(rpcClient.api.handshake({
        sessionId: sessionId,
        deviceInfo: {
          id: deviceInfo.uuid,
          displayName: deviceInfo.name,
          appVersionMajor: version[1],
          appVersionMinor: version[2],
          appVersionPatch: version[3]
        },
      }), this._cancelSubject);
      console.log(handshakeResponse);
      if (!handshakeResponse) {
        return false;
      }

      const peerId = handshakeResponse.peerId;

      // Shall we move it out?
      if (!!this.currentPeerId && this.currentPeerId !== peerId && !isReseted) {
        if (!await requestDialog(
          'The remote device\'s peer id does not match the last session. The wallet will be synced from scratch. Continue?'
        )) {
          return;
        }
        this.clearCurrencies();
        this.resetEvent.next();
        return;
      }

      const syncStatusResponse = await waitFiorPromise<any>(rpcClient.api.syncStatus({
        sessionId: sessionId
      }), this._cancelSubject);
      console.log(syncStatusResponse);
      if (!syncStatusResponse) {
        return false;
      }

      const remoteSyncedCurrencies = syncStatusResponse.statuses
        .filter(status => status.state === SyncState.Finalized)
        .map(status => status.currencyId);

      console.log('Remote synched currencies:', remoteSyncedCurrencies);

      const localSynchedCurrencies = this.currencies
        .filter(c => c.state.getValue() === SyncState.Finalized)
        .map(c => c.id);

      console.log('Local synched currencies:', localSynchedCurrencies);

      const unsyncedCurrencies = localSynchedCurrencies.filter(x => !remoteSyncedCurrencies.includes(x));

      if (startWith === null &&  unsyncedCurrencies.length > 0) {
        this.resyncEvent.next();
      } else if (startWith !== null && unsyncedCurrencies.includes(startWith)) {
        this.resyncEvent.next();
      }

      this._currentPeerId = peerId;

      const commonSynchedCurrencies = remoteSyncedCurrencies.filter(x => localSynchedCurrencies.includes(x));

      console.log('Common synched currencies:', commonSynchedCurrencies);

      if (startWith !== null) {
        this._syncQueue = [startWith].concat(
          this._currencyInfoService.syncOrder.filter(x => !commonSynchedCurrencies.includes(x) && x !== startWith)
        );
      } else {
        this._syncQueue = this._currencyInfoService.syncOrder.filter(x => !commonSynchedCurrencies.includes(x));
      }

      while (this._syncQueue.length > 0 && !this._cancelled) {
        console.log('Sync queue', this._syncQueue);
        const currencyId = this._syncQueue[0];
        const currencyInfo = this._currencyInfoService.currencyInfo(currencyId);

        let currency = null;
        switch (currencyInfo.cryptosystem) {
          case Cryptosystem.Ecdsa:
            currency = new EcdsaCurrency(
              currencyId,
              sessionId,
              paillierPublicKey,
              paillierSecretKey,
              this._currencyInfoService,
              this._keyChainService,
              this._workerService,
            );
            break;
          case Cryptosystem.Eddsa:
            currency = new EddsaCurrency(
              currencyId,
              sessionId,
              this._currencyInfoService,
              this._keyChainService,
              this._workerService,
            );
            break;
        }

        this._currencies.set(currencyId, currency);

        this.currencyEvent.next(currencyId);

        console.log('Starting syncing', this._currencyInfoService.currencyInfo(currencyId).name);
        const success = await waitFiorPromise<any>(currency.sync(rpcClient), this._cancelSubject);
        if (success) {
          console.log('Finished syncing', this._currencyInfoService.currencyInfo(currencyId).name);
          const position = this._syncQueue.indexOf(currencyId);
          if (position !== -1) {
            this._syncQueue.splice(position, 1);
          }
        } else {
          currency.cancel();
          console.log('Cancelled syncing', this._currencyInfoService.currencyInfo(currencyId).name);
        }
      }
    } catch (e) {
      throw e;
    } finally {
      this.synchronizing.next(false);
    }

    return !this._cancelled;
  }

  public forceCurrency(currencyId: CurrencyId): void {
    const position = this._syncQueue.indexOf(currencyId);
    if (position !== -1) {
      this._syncQueue.splice(position, 1);
      this._syncQueue.unshift(currencyId);

      this._cancelSubject.next();
    }
  }

  public async cancel(): Promise<void> {
    if (!this.synchronizing.getValue()) {
      return;
    }

    this._cancelled = true;
    this._cancelSubject.next();

    await waitForSubject(this.synchronizing, false);
  }

  public async reset(): Promise<void> {
    if (this.synchronizing.getValue()) {
      await this.cancel();
    }

    this._currentPeerId = null;

    this.clearCurrencies();
  }

  public async resetRemote(
    sessionId: string,
    rpcClient: RPCClient
  ): Promise<void> {
    try {
      await rpcClient.api.clearSession({
        sessionId
      }, 2000, 0);
    } catch (e) {
      console.error('Failed to reset remote session', e);
    }
  }

  private clearCurrencies(): void {
    const currencies = Array.from(this._currencies.keys());

    this._currencies.clear();

    for (const currencyId of currencies) {
      this.currencyEvent.next(currencyId);
    }
  }
}
