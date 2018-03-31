import { EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { BluetoothService } from '../bluetooth.service';
import { LoggerService } from '../logger.service';

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

  public ready: EventEmitter<any> = new EventEmitter();
  public signed: EventEmitter<any> = new EventEmitter();

  public canceled: EventEmitter<any> = new EventEmitter();
  public failed:   EventEmitter<any> = new EventEmitter();

  private cancelObserver: ReplaySubject<boolean> = new ReplaySubject(1);

  private mapping: any = null;

  private subscriptions = [];

  constructor(
    private tx: any,
    private compoundKey: any,
    private messageSubject: ReplaySubject<any>,
    private bt: BluetoothService
  ) {
    this.entropyCommitmentsObserver =
      this.messageSubject
        .filter(object => object.type === 'entropyCommitments')
        .map(object => object.content);

    this.entropyDecommitmentsObserver =
      this.messageSubject
        .filter(object => object.type === 'entropyDecommitments')
        .map(object => object.content);

    this.chiphertextsObserver =
      this.messageSubject
        .filter(object => object.type === 'chiphertexts')
        .map(object => object.content);

    this.subscriptions.push(
      this.messageSubject
        .filter(object => object.type === 'cancelTransaction')
        .subscribe(() => {
          this.cancelObserver.next(true);
          if (this.status.getValue() === TransactionStatus.Ready) {
            LoggerService.log('Cancelled after sync', {});
            this.status.next(TransactionStatus.Cancelled);
            this.canceled.emit();
          }
        }));
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
    this.failed.emit();
    throw new Error(message);
  }

  private handleCancel() {
    LoggerService.log('Cancelled', {});
    this.status.next(TransactionStatus.Cancelled);
    this.canceled.emit();
    throw new Error('Cancelled');
  }

  public async cancel() {
    this.cancelObserver.next(true);
    if (!await this.bt.send(JSON.stringify({
        type: 'cancelTransaction',
        content: {}
      }))) {
      LoggerService.nonFatalCrash('Failed to send cancel', null);
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

    if (!await this.bt.send(JSON.stringify({
        type: 'entropyCommitments',
        content: entropyCommitments
      }))) {
      return this.handleFailure('Failed to send entropyCommitment', null);
    }

    const remoteEntropyCommitments = await this.entropyCommitmentsObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteEntropyCommitments) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyCommitments);
    let entropyDecommitments = null;
    try {
      entropyDecommitments = await this.tx.processEntropyCommitments(remoteEntropyCommitments);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyCommitment', e);
    }

    if (!await this.bt.send(JSON.stringify({
        type: 'entropyDecommitments',
        content: entropyDecommitments
      }))) {
      return this.handleFailure('Failed to send entropyDecommitments', null);
    }

    const remoteEntropyDecommitments = await this.entropyDecommitmentsObserver.take(1).takeUntil(this.cancelObserver).toPromise();
    if (!remoteEntropyDecommitments) {
      return this.handleCancel();
    }

    this.status.next(TransactionStatus.EntropyDecommitments);
    try {
      await this.tx.processEntropyDecommitments(remoteEntropyDecommitments);
    } catch (e) {
      return this.handleFailure('Failed to process remoteEntropyDecommitments', e);
    }

    this.status.next(TransactionStatus.Ready);
    this.ready.emit();
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

    const remoteChiphertexts = await this.chiphertextsObserver.take(1).takeUntil(this.cancelObserver).toPromise();
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
    this.signed.emit();
  }
}
