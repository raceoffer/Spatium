'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { BitcoreTransaction } from './bitcoretransaction';

export class BitcoinTransaction extends BitcoreTransaction {
  constructor(state) {
    super('BitcoinTransaction', state);
  }

  static useWorker(worker) {
    BitcoinTransaction.worker = worker;
    BitcoreTransaction.useWorker(worker);
  }

  static async invokeStatic(message, wrapped) {
    assert(BitcoinTransaction.worker);
    const result = await BitcoinTransaction.worker.postMessage({
      action: 'invokeStatic',
      class: 'BitcoinTransaction',
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });
    return wrapped ? result : unwrap(result);
  }

  static async fromOptions(options) {
    return new BitcoinTransaction(await BitcoinTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
  }

  static async fromJSON(json) {
    return new BitcoinTransaction(await BitcoinTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, true));
  }
}
