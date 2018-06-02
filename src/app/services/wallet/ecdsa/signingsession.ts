import { OnDestroy } from '@angular/core';
import { BehaviorSubject,  Observable,  ReplaySubject,  Subject } from 'rxjs';
import { BluetoothService } from '../../bluetooth.service';
import { LoggerService } from '../../logger.service';

import { filter, take, map, takeUntil } from 'rxjs/operators';

export enum TransactionStatus {
  None = 0,
  Started,
  EntropyCommitment,
  EntropyDecommitment,
  Ready,
  Signed,
  Cancelled,
  Failed
}

export class SignSession implements OnDestroy {
  public status: BehaviorSubject<TransactionStatus> = new BehaviorSubject<TransactionStatus>(TransactionStatus.None);

  private entropyCommitmentObserver:   Observable<any>;
  private entropyDecommitmentObserver: Observable<any>;
  private partialSignatureObsever:     Observable<any>;

  public ready: Subject<any> = new Subject<any>();
  public signed: Subject<any> = new Subject<any>();

  public canceled: Subject<any> = new Subject<any>();
  public failed:   Subject<any> = new Subject<any>();

  private canceledSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private subscriptions = [];

  constructor(
    private tx: any,
    private compoundKey: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.entropyCommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'entropyCommitment'),
        map(object => object.content)
      );

    this.entropyDecommitmentObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'entropyDecommitment'),
        map(object => object.content)
      );

    this.partialSignatureObsever =
      this.messageSubject.pipe(
        filter(object => object.type === 'partialSignature'),
        map(object => object.content)
      );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public get transaction() {
    return this.tx;
  }

  private handleFailure(message, exception) {
    LoggerService.nonFatalCrash(message, exception);
    this.status.next(TransactionStatus.Failed);
    this.failed.next();
    throw new Error(message);
  }

  private handleCancel() {
    LoggerService.log('Cancelled', {});
    this.status.next(TransactionStatus.Cancelled);
    this.canceled.next();
    throw new Error('Cancelled');
  }

  public async cancel() {
    this.canceledSubject.next(true);

    if (this.status.getValue() === TransactionStatus.Ready) {
      this.status.next(TransactionStatus.Cancelled);
      this.canceled.next();
    }
  }

  public async sync() {
    this.status.next(TransactionStatus.Started);

    await this.tx.startSignSession(this.compoundKey);

    let entropyCommitment = null;
    try {
      entropyCommitment = await this.tx.createCommitment();
    } catch (e) {
      return this.handleFailure('Failed to get entropyCommitment', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'entropyCommitment',
        content: entropyCommitment
      }))) {
      return this.handleFailure('Failed to send entropyCommitment', null);
    }

    const remoteEntropyCommitment = await this.entropyCommitmentObserver.pipe(
      take(1),
      takeUntil(this.canceledSubject.pipe(filter(b => b)))
    ).toPromise();

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyCommitment);

    let entropyDecommitment = null;
    try {
      entropyDecommitment = await this.tx.processCommitment(remoteEntropyCommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyCommitment', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'entropyDecommitment',
        content: entropyDecommitment
      }))) {
      return this.handleFailure('Failed to send entropyDecommitment', null);
    }

    const remoteEntropyDecommitment = await this.entropyDecommitmentObserver.pipe(
      take(1),
      takeUntil(this.canceledSubject.pipe(filter(b => b)))
    ).toPromise();

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyDecommitment);

    try {
      await this.tx.processDecommitment(remoteEntropyDecommitment);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyDecommitment', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.Ready);
    this.ready.next();
  }

  public async submitPartialSignature() {
    if (this.status.getValue() !== TransactionStatus.Ready) {
      LoggerService.nonFatalCrash('Cannot submit non-synchronized tx', null);
      return;
    }

    let partialSignature = null;
    try {
      partialSignature = await this.tx.computeSignature();
    } catch (e) {
      return this.handleFailure('Failed to compute a partial signature', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'partialSignature',
        content: partialSignature
      }))) {
      return this.handleFailure('Failed to send a partial signature', null);
    }
  }

  public async awaitPartialSignature() {
    if (this.status.getValue() !== TransactionStatus.Ready) {
      LoggerService.nonFatalCrash('Cannot await partial signature for non-synchronized tx', null);
      return;
    }

    const remotePartialSignature = await this.partialSignatureObsever.pipe(
      take(1),
      takeUntil(this.canceledSubject.pipe(filter(b => b)))
    ).toPromise();

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    await this.tx.applySignature(remotePartialSignature);

    this.status.next(TransactionStatus.Signed);
    this.signed.next();
  }
}
