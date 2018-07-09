import { Injectable } from '@angular/core';
import { createWorker } from 'crypto-core-async/lib/createworker';
import { DeviceService, Platform } from './device.service';

@Injectable()
export class WorkerService {
  private _worker = createWorker();

  constructor(private readonly deviceService: DeviceService) {}

  public get worker() {
    if (this.deviceService.platform !== Platform.Windows) {
      return this._worker;
    } else {
      return null;
    }
  }

  public get workerUnsafe() {
    return this._worker;
  }
}
