import { Injectable } from '@angular/core';

import { createWorker } from 'crypto-core-async/lib/createworker';

@Injectable()
export class WorkerService {
  public worker = createWorker();
}
