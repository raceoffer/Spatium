import { OnDestroy } from '@angular/core';
import { BehaviorSubject,  Observable,  ReplaySubject,  Subject } from 'rxjs';
import { BluetoothService } from '../bluetooth.service';
import { LoggerService } from '../logger.service';

import { filter, take, map, takeUntil } from 'rxjs/operators';

export enum TransactionStatus {
  None = 0,
  Started,
  EntropyCommitments,
  EntropyDecommitments,
  Ready,
  Signed,
  Cancelled,
  Failed
}

export class SignSession implements OnDestroy {
  public status: BehaviorSubject<TransactionStatus> = new BehaviorSubject<TransactionStatus>(TransactionStatus.None);

  private entropyCommitmentsObserver:   Observable<any>;
  private entropyDecommitmentsObserver: Observable<any>;
  private chiphertextsObserver:         Observable<any>;

  public ready: Subject<any> = new Subject<any>();
  public signed: Subject<any> = new Subject<any>();

  public canceled: Subject<any> = new Subject<any>();
  public failed:   Subject<any> = new Subject<any>();

  private canceledSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private mapping: any = null;

  private subscriptions = [];

  constructor(
    private tx: any,
    private compoundKey: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.entropyCommitmentsObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'entropyCommitments'),
        map(object => object.content)
      );

    this.entropyDecommitmentsObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'entropyDecommitments'),
        map(object => object.content)
      );

    this.chiphertextsObserver =
      this.messageSubject.pipe(
        filter(object => object.type === 'chiphertexts'),
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

    this.mapping = await this.tx.mapInputs(this.compoundKey);

    const hashes = await this.tx.getHashes(this.mapping);

    await this.tx.startSign(hashes, this.mapping);

    let entropyCommitments = null;
    try {
      entropyCommitments = await this.tx.createEntropyCommitments();
    } catch (e) {
      return this.handleFailure('Failed to get entropyCommitments', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'entropyCommitments',
        content: entropyCommitments
      }))) {
      return this.handleFailure('Failed to send entropyCommitment', null);
    }

    const remoteEntropyCommitments = await this.entropyCommitmentsObserver.pipe(
      take(1),
      takeUntil(this.canceledSubject.pipe(filter(b => b)))
    ).toPromise();
    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyCommitments);
    let entropyDecommitments = null;
    try {
      entropyDecommitments = await this.tx.processEntropyCommitments(remoteEntropyCommitments);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyCommitment', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'entropyDecommitments',
        content: entropyDecommitments
      }))) {
      return this.handleFailure('Failed to send entropyDecommitments', null);
    }

    const remoteEntropyDecommitments = await this.entropyDecommitmentsObserver.pipe(
      take(1),
      takeUntil(this.canceledSubject.pipe(filter(b => b)))
    ).toPromise();
    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyDecommitments);
    try {
      await this.tx.processEntropyDecommitments(remoteEntropyDecommitments);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyDecommitments', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.Ready);
    this.ready.next();
  }

  public async submitChiphertexts() {
    if (this.status.getValue() !== TransactionStatus.Ready) {
      LoggerService.nonFatalCrash('Cannot submit non-synchronized tx', null);
      return;
    }

    let chiphertexts = null;
    try {
      chiphertexts = await this.tx.computeCiphertexts();
    } catch (e) {
      return this.handleFailure('Failed to compute chiphertexts', e);
    }

    if (this.canceledSubject.getValue()) {
      return this.handleCancel();
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'chiphertexts',
        content: chiphertexts
      }))) {
      return this.handleFailure('Failed to send chiphertexts', null);
    }
  }

  public async awaitConfirmation() {
    if (this.status.getValue() !== TransactionStatus.Ready) {
      LoggerService.nonFatalCrash('Cannot await chiphertexts for non-synchronized tx', null);
      return;
    }

    const remoteChiphertexts = await this.chiphertextsObserver.pipe(
      take(1),
      takeUntil(this.canceledSubject.pipe(filter(b => b)))
    ).toPromise();
    if (!remoteChiphertexts) {
      return this.handleCancel();
    }

    let rawSignatures = null;
    try {
      rawSignatures = await this.tx.extractSignatures(remoteChiphertexts);
    } catch (e) {
      return this.handleFailure('Failed to process remoteChiphertexts', e);
    }

    const signatures = await this.tx.normalizeSignatures(this.mapping, rawSignatures);

    await this.tx.applySignatures(signatures);

    this.status.next(TransactionStatus.Signed);
    this.signed.next();
  }
}
