import { EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject ,  Observable ,  ReplaySubject } from 'rxjs';
import { BluetoothService } from '../bluetooth.service';
import { LoggerService } from '../logger.service';

import { filter, take, map, takeUntil } from 'rxjs/operators';

export enum SynchronizationStatus {
  None = 0,
  Started,
  InitialCommitment,
  InitialDecommitment,
  VerifierCommitment,
  ProverCommitment,
  VerifierDecommitment,
  ProverDecommitment,
  Finished
}

export class SyncSession implements OnDestroy {
  public status: BehaviorSubject<SynchronizationStatus> = new BehaviorSubject<SynchronizationStatus>(SynchronizationStatus.None);

  private initialCommitmentObserver:    Observable<any>;
  private initialDecommitmentObserver:  Observable<any>;
  private verifierCommitmentObserver:   Observable<any>;
  private proverCommitmentObserver:     Observable<any>;
  private verifierDecommitmentObserver: Observable<any>;
  private proverDecommitmentObserver:   Observable<any>;

  public finished: EventEmitter<any> = new EventEmitter();
  public canceled: EventEmitter<any> = new EventEmitter();
  public failed:   EventEmitter<any> = new EventEmitter();

  private cancelled: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private subscriptions = [];

  constructor(
    private prover: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.initialCommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'initialCommitment'),
        map(object => object.content)
      );

    this.initialDecommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'initialDecommitment'),
        map(object => object.content)
      );

    this.verifierCommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'verifierCommitment'),
        map(object => object.content)
      );

    this.proverCommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'proverCommitment'),
        map(object => object.content)
      );

    this.verifierDecommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'verifierDecommitment'),
        map(object => object.content)
      );

    this.proverDecommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'proverDecommitment'),
        map(object => object.content)
      );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
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
    let initialCommitment = null;
    try {
      initialCommitment = await this.prover.getInitialCommitment();
    } catch (e) {
      return this.handleFailure('Failed to get initialCommitment', e);
    }

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'initialCommitment',
        content: initialCommitment
      }))) {
      return this.handleFailure('Failed to send initialCommitment', null);
    }

    const remoteInitialCommitment = await this.initialCommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();
    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    this.status.next(SynchronizationStatus.InitialCommitment);
    let initialDecommitment = null;
    try {
      initialDecommitment = await this.prover.processInitialCommitment(remoteInitialCommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteInitialCommitment', e);
    }

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'initialDecommitment',
        content: initialDecommitment
      }))) {
      return this.handleFailure('Failed to send initialDecommitment', null);
    }

    const remoteInitialDecommitment = await this.initialDecommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();
    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    this.status.next(SynchronizationStatus.InitialDecommitment);
    let verifier = null;
    try {
      verifier = await this.prover.processInitialDecommitment(remoteInitialDecommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteInitialDecommitment', e);
    }

    const verifierCommitment = await verifier.getCommitment();

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'verifierCommitment',
        content: verifierCommitment
      }))) {
      return this.handleFailure('Failed to send verifierCommitment', null);
    }

    const remoteVerifierCommitment = await this.verifierCommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();
    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    this.status.next(SynchronizationStatus.VerifierCommitment);
    let proverCommitment = null;
    try {
      proverCommitment = await this.prover.processCommitment(remoteVerifierCommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteVerifierCommitment', e);
    }

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'proverCommitment',
        content: proverCommitment
      }))) {
      return this.handleFailure('Failed to send proverCommitment', null);
    }

    const remoteProverCommitment = await this.proverCommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();
    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    this.status.next(SynchronizationStatus.ProverCommitment);
    let verifierDecommitment = null;
    try {
      verifierDecommitment = await verifier.processCommitment(remoteProverCommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteProverCommitment', e);
    }

    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'verifierDecommitment',
        content: verifierDecommitment
      }))) {
      return this.handleFailure('Failed to send verifierDecommitment', null);
    }

    const remoteVerifierDecommitment = await this.verifierDecommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();
    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    this.status.next(SynchronizationStatus.VerifierDecommitment);
    let proverDecommitment = null;
    try {
      proverDecommitment = await this.prover.processDecommitment(remoteVerifierDecommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteVerifierDecommitment', e);
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'proverDecommitment',
        content: proverDecommitment
      }))) {
      return this.handleFailure('Failed to send proverDecommitment', null);
    }

    const remoteProverDecommitment = await this.proverDecommitmentObserver.pipe(
      take(1),
      takeUntil(this.cancelled.pipe(filter(b => b)))
    ).toPromise();
    if (this.cancelled.getValue()) {
      return this.handleCancel();
    }

    this.status.next(SynchronizationStatus.ProverDecommitment);
    let verifiedData = null;
    try {
      verifiedData = await verifier.processDecommitment(remoteProverDecommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteProverDecommitment', e);
    }

    this.status.next(SynchronizationStatus.Finished);
    this.finished.emit(verifiedData);

    return verifiedData;
  }
}
