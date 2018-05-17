import { OverlayRef } from '@angular/cdk/overlay';
import { EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export class FactorParentOverlayRef<T = any> {
  public onAddFactor = new EventEmitter();
  public onBackClicked = new EventEmitter();
  public value: BehaviorSubject<string> = null;

  constructor(private overlayRef: OverlayRef) { }

  close(): void {
    this.overlayRef.dispose();
    this.overlayRef.detach();
  }
}
