import { Injectable } from '@angular/core';
import { createWorker } from 'crypto-core-async/lib/createworker';

declare const device: any;

@Injectable()
export class WorkerService {
  private _worker = createWorker();

  public get worker() {
    if (device.platform !== 'windows') {
      return this._worker;
    } else {
      return null;
    }
  }

  public get workerUnsafe() {
    return this._worker;
  }
}
