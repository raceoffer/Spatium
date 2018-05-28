import PromiseWorker from 'promise-worker';

export function createWorker() {
  return new PromiseWorker(new Worker('webworker.bundle.js'));
}