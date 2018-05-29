import { Injectable } from '@angular/core';
import { DeviceService } from './device.service';

import { createWorker } from 'crypto-core-async/lib/createworker';

declare const device: any;

@Injectable()
export class WorkerService {
  public worker = null;

  constructor(private readonly deviceService: DeviceService) {
    this.init();
  }

  async init() {
    await this.deviceService.deviceReady();
    
    if (!device.isWindows) {
      this.worker = createWorker();
    }
  }
}
