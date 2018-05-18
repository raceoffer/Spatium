'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { BitcoreTransaction } from './bitcoretransaction';

export class BitcoinCashTransaction extends BitcoreTransaction {
  constructor(state) {
    super('BitcoinCashTransaction', state);
  }

  static useWorker(worker) {
    BitcoinCashTransaction.worker = worker;
    BitcoreTransaction.useWorker(worker);
  }

  static async invokeStatic(message, wrapped) {
    assert(BitcoinCashTransaction.worker);
    const result = await BitcoinCashTransaction.worker.postMessage({
      action: 'invokeStatic',
      class: 'BitcoinCashTransaction',
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });
    return wrapped ? result : unwrap(result);
  }

  static async fromOptions(options) {
    return new BitcoinCashTransaction(await BitcoinCashTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
  }

  static async fromJSON(json) {
    return new BitcoinCashTransaction(await BitcoinCashTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, true));
  }
}
