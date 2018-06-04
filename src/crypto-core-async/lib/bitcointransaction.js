'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { BitcoinTransaction as CoreBitcoinTransaction } from 'crypto-core/lib/transaction/bitcore/bitcointransaction';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { BitcoreTransaction } from './bitcoretransaction';

export class BitcoinTransaction extends BitcoreTransaction {
  constructor(state, worker) {
    super('BitcoinTransaction', state, worker);
  }

  static async invokeStatic(message, worker, wrapped) {
    if (worker) {
      const result = await worker.postMessage({
        action: 'invokeStatic',
        class: 'BitcoinTransaction',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CoreBitcoinTransaction, message.method, ... message.arguments);
    }
  }

  static async create(worker) {
    const state = await BitcoinTransaction.invokeStatic({
      method: 'create',
      arguments: []
    }, worker, true);

    return worker ? new BitcoinTransaction(state, worker) : state;
  }

  static async fromOptions(options, worker) {
    const state = await BitcoinTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worker, true);

    return worker ? new BitcoinTransaction(state, worker) : state;
  }

  static async fromJSON(json, worker) {
    const state = await BitcoinTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, worker, true);

    return worker ? new BitcoinTransaction(state, worker) : state;
  }
}
