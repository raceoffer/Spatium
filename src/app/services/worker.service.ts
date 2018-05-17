import { Injectable } from '@angular/core';

import { createWorker } from 'crypto-core-async';

@Injectable()
export class WorkerService {
  public worker = createWorker();
}
