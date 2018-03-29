import { EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { BluetoothService } from '../bluetooth.service';
import { LoggerService } from '../logger.service';

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

export class SyncSession {
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

  private cancelObserver: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(
    private prover: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.initialCommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'initialCommitment')
        .map(object => object.content);

    this.initialDecommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'initialDecommitment')
        .map(object => object.content);

    this.verifierCommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'verifierCommitment')
        .map(object => object.content);

    this.proverCommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'proverCommitment')
        .map(object => object.content);

    this.verifierDecommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'verifierDecommitment')
        .map(object => object.content);

    this.proverDecommitmentObserver =
      this.messageSubject
        .filter(object => object.type === 'proverDecommitment')
        .map(object => object.content);

    this.messageSubject
      .filter(object => object.type === 'cancel')
      .subscribe(() => this.cancelObserver.next(true));
  }

  public async cancel() {
    this.cancelObserver.next(true);
    if (!await this.bt.send(JSON.stringify({
        type: 'cancel',
        content: {}
      }))) {
      LoggerService.nonFatalCrash('Failed to send cancel', null);
    }
  }

  public async sync() {
    const handleFailure = (message, exception) => {
      LoggerService.nonFatalCrash(message, exception);
      this.status.next(SynchronizationStatus.Finished);
      this.failed.emit();
      throw new Error(message);
    };

    const handleCancel = () => {
      LoggerService.log('Cancelled', {});
      this.status.next(SynchronizationStatus.Finished);
      this.canceled.emit();
      throw new Error('Cancelled');
    };

    this.status.next(SynchronizationStatus.Started);
    let initialCommitment = null;
    try {
      initialCommitment = await this.prover.getInitialCommitment();
    } catch (e) {
      return handleFailure('Failed to get initialCommitment', e);
    }

    LoggerService.log('Sending initialCommitment:', initialCommitment);
    if (!await this.bt.send(JSON.stringify({
        type: 'initialCommitment',
        content: initialCommitment
      }))) {
      return handleFailure('Failed to send initialCommitment', null);
    }

    const remoteInitialCommitment = await this.initialCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteInitialCommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.InitialCommitment);
    LoggerService.log('Received remoteInitialCommitment', remoteInitialCommitment);
    let initialDecommitment = null;
    try {
      initialDecommitment = await this.prover.processInitialCommitment(remoteInitialCommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteInitialCommitment', e);
    }

    LoggerService.log('Sending initialDecommitment', initialDecommitment);
    if (!await this.bt.send(JSON.stringify({
        type: 'initialDecommitment',
        content: initialDecommitment
      }))) {
      return handleFailure('Failed to send initialDecommitment', null);
    }

    const remoteInitialDecommitment = await this.initialDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteInitialDecommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.InitialDecommitment);
    LoggerService.log('Received remoteInitialDecommitment', remoteInitialDecommitment);
    let verifier = null;
    try {
      verifier = await this.prover.processInitialDecommitment(remoteInitialDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteInitialDecommitment', e);
    }

    const verifierCommitment = await verifier.getCommitment();

    LoggerService.log('Sending verifierCommitment', verifierCommitment);
    if (!await this.bt.send(JSON.stringify({
        type: 'verifierCommitment',
        content: verifierCommitment
      }))) {
      return handleFailure('Failed to send verifierCommitment', null);
    }

    const remoteVerifierCommitment = await this.verifierCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteVerifierCommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.VerifierCommitment);
    LoggerService.log('Received remoteVerifierCommitment', remoteVerifierCommitment);
    let proverCommitment = null;
    try {
      proverCommitment = await this.prover.processCommitment(remoteVerifierCommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteVerifierCommitment', e);
    }

    LoggerService.log('Sending proverCommitment', proverCommitment);
    if (!await this.bt.send(JSON.stringify({
        type: 'proverCommitment',
        content: proverCommitment
      }))) {
      return handleFailure('Failed to send proverCommitment', null);
    }

    const remoteProverCommitment = await this.proverCommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteProverCommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.ProverCommitment);
    LoggerService.log('Received remoteProverCommitment', remoteProverCommitment);
    let verifierDecommitment = null;
    try {
      verifierDecommitment = await verifier.processCommitment(remoteProverCommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteProverCommitment', e);
    }

    LoggerService.log('Sending verifierDecommitment', verifierDecommitment);
    if (!await this.bt.send(JSON.stringify({
        type: 'verifierDecommitment',
        content: verifierDecommitment
      }))) {
      return handleFailure('Failed to send verifierDecommitment', null);
    }

    const remoteVerifierDecommitment = await this.verifierDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteVerifierDecommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.VerifierDecommitment);
    LoggerService.log('Received remoteVerifierDecommitment', remoteVerifierDecommitment);
    let proverDecommitment = null;
    try {
      proverDecommitment = await this.prover.processDecommitment(remoteVerifierDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteVerifierDecommitment', e);
    }

    LoggerService.log('Sending proverDecommitment', proverDecommitment);
    if (!await this.bt.send(JSON.stringify({
        type: 'proverDecommitment',
        content: proverDecommitment
      }))) {
      return handleFailure('Failed to send proverDecommitment', null);
    }

    const remoteProverDecommitment = await this.proverDecommitmentObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteProverDecommitment) {
      return handleCancel();
    }

    this.status.next(SynchronizationStatus.ProverDecommitment);
    LoggerService.log('Received remoteProverDecommitment', remoteProverDecommitment);
    let verifiedData = null;
    try {
      verifiedData = await verifier.processDecommitment(remoteProverDecommitment);
    } catch (e) {
      return handleFailure('Failed to process remoteProverDecommitment', e);
    }

    this.status.next(SynchronizationStatus.Finished);
    this.finished.emit(verifiedData);

    return verifiedData;
  }
}
