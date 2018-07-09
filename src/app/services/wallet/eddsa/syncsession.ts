import { EventEmitter, OnDestroy } from '@angular/core';
import { Marshal } from 'crypto-core-async';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { ConnectionProviderService } from '../../connection-provider';
import { LoggerService } from '../../logger.service';

export enum SynchronizationStatus {
  None = 0,
  Started,
  Commitment,
  Decommitment,
  Finished
}

export class SyncSession implements OnDestroy {
  public status: BehaviorSubject<SynchronizationStatus> = new BehaviorSubject<SynchronizationStatus>(SynchronizationStatus.None);
  public finished: EventEmitter<any> = new EventEmitter();
  public canceled: EventEmitter<any> = new EventEmitter();
  public failed: EventEmitter<any> = new EventEmitter();
  private commitmentObserver: Observable<any>;
  private decommitmentObserver: Observable<any>;
  private cancelled: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private subscriptions = [];

  constructor(private compoundKey: any,
              private messageSubject: ReplaySubject<any>,
              private connectionProviderService: ConnectionProviderService) {
    this.commitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'eddsaCommitment'),
        map(object => Marshal.unwrap(object.content))
      );

    this.decommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'eddsaDecommitment'),
        map(object => Marshal.unwrap(object.content))
      );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async cancel() {
    this.cancelled.next(true);
  }

  public async sync() {
    this.status.next(SynchronizationStatus.Started);

    let syncSession = null;
    try {
      syncSession = await this.compoundKey.startSyncSession();
    } catch (e) {
      return this.handleFailure('Failed to start sync session', e);
    }

    let commitment = null;
    try {
      commitment = await syncSession.createCommitment();
    } catch (e) {
      return this.handleFailure('Failed to get initialCommitment', e);
    }

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    console.log('Sending commitment', commitment);

    try {
      await this.send('eddsaCommitment', commitment);
    } catch (e) {
      return this.handleFailure('Failed to send commitment', null);
    }

    const remoteCommitment = await this.commitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    console.log('Received remote commitment', remoteCommitment);

    this.status.next(SynchronizationStatus.Commitment);

    let decommitment = null;
    try {
      decommitment = await syncSession.processCommitment(remoteCommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteCommitment', e);
    }

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    console.log('Sending decommitment', decommitment);

    try {
      await this.send('eddsaDecommitment', decommitment);
    } catch (e) {
      return this.handleFailure('Failed to send decommitment', null);
    }

    const remoteDecommitment = await this.decommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    console.log('Received remote decommitment', remoteDecommitment);

    this.status.next(SynchronizationStatus.Decommitment);

    let syncData = null;
    try {
      syncData = await syncSession.processDecommitment(remoteDecommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteDecommitment', e);
    }

    console.log('Synched data', syncData);

    this.status.next(SynchronizationStatus.Finished);
    this.finished.emit(syncData);

    return syncData;
  }

  private async send(msg, obj) {
    return await this.connectionProviderService.send(JSON.stringify({
      type: msg,
      content: Marshal.wrap(obj)
    }));
  }

  private handleFailure(message, exception) {
    LoggerService.nonFatalCrash(message, exception);
    this.status.next(SynchronizationStatus.Finished);
    this.failed.emit();
    throw new Error(message);
  }

  private handleCancel() {
    LoggerService.log('Cancelled', {});
    this.status.next(SynchronizationStatus.Finished);
    this.canceled.emit();
    throw new Error('Cancelled');
  }
}
