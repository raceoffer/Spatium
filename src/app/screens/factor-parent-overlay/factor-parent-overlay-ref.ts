import { OverlayRef } from '@angular/cdk/overlay';
import {EventEmitter} from '@angular/core';


export class FactorParentOverlayRef<T = any> {

  onAddFactor = new EventEmitter();

  constructor(private overlayRef: OverlayRef) {  }

  close(): void {
    this.overlayRef.dispose();
  }
}
