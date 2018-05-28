'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { BitcoreTransaction } from './bitcoretransaction';

export class LitecoinTransaction extends BitcoreTransaction {
  constructor(state) {
    super('LitecoinTransaction', state);
  }

  static useWorker(worker) {
    LitecoinTransaction.worker = worker;
    BitcoreTransaction.useWorker(worker);
  }

  static async invokeStatic(message, wrapped) {
    assert(LitecoinTransaction.worker);
    const result = await LitecoinTransaction.worker.postMessage({
      action: 'invokeStatic',
      class: 'LitecoinTransaction',
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });
    return wrapped ? result : unwrap(result);
  }

  static async fromOptions(options) {
    return new LitecoinTransaction(await LitecoinTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
  }

  static async fromJSON(json) {
    return new LitecoinTransaction(await LitecoinTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, true));
  }
}
