import { EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject ,  Observable ,  ReplaySubject } from 'rxjs';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';

import { filter, take, map, takeUntil } from 'rxjs/operators';

import { Marshal } from 'crypto-core-async';

export enum SynchronizationStatus {
  None = 0,
  Started,
  Commitment,
  Decommitment,
  Finished
}

export class SyncSession implements OnDestroy {
  public status: BehaviorSubject<SynchronizationStatus> = new BehaviorSubject<SynchronizationStatus>(SynchronizationStatus.None);

  private commitmentObserver:    Observable<any>;
  private decommitmentObserver:  Observable<any>;

  public finished: EventEmitter<any> = new EventEmitter();
  public canceled: EventEmitter<any> = new EventEmitter();
  public failed:   EventEmitter<any> = new EventEmitter();

  private cancelled: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private subscriptions = [];

  constructor(
    private compoundKey: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
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

  private async send(msg, obj) {
    return await this.bt.send(JSON.stringify({
      type: msg,
      content: Marshal.wrap(obj)
    }))
  }

  public async cancel() {
    this.cancelled.next(true);
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

    if (!await this.send('eddsaCommitment', commitment)) {
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

    if (!await this.send('eddsaDecommitment', decommitment)) {
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
}
