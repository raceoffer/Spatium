'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { LitecoinTransaction as CoreLitecoinTransaction } from 'crypto-core/lib/transaction/bitcore/litecointransaction';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { BitcoreTransaction } from './bitcoretransaction';

export class LitecoinTransaction extends BitcoreTransaction {
  constructor(state, worker) {
    super('LitecoinTransaction', state, worker);
  }

  static async invokeStatic(message, worker, wrapped) {
    if (worker) {
      const result = await worker.postMessage({
        action: 'invokeStatic',
        class: 'LitecoinTransaction',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CoreLitecoinTransaction, message.method, ... message.arguments);
    }
  }

  static async create(worker) {
    const state = await LitecoinTransaction.invokeStatic({
      method: 'create',
      arguments: []
    }, worker, true);

    return worker ? new LitecoinTransaction(state, worker) : state;
  }

  static async fromOptions(options, worker) {
    const state = await LitecoinTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worker, true);

    return worker ? new LitecoinTransaction(state, worker) : state;
  }

  static async fromJSON(json, worker) {
    const state = await LitecoinTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, worker, true);

    return worker ? new LitecoinTransaction(state, worker) : state;
  }
}
