'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { BitcoinCashTransaction as CoreBitcoinCashTransaction } from 'crypto-core/lib/transaction/bitcore/bitcoincashtransaction';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { BitcoreTransaction } from './bitcoretransaction';

export class BitcoinCashTransaction extends BitcoreTransaction {
  constructor(state, woker) {
    super('BitcoinCashTransaction', state, worker);
  }

  static async invokeStatic(message, worker, wrapped) {
    if (worker) {
      const result = await worker.postMessage({
        action: 'invokeStatic',
        class: 'BitcoinCashTransaction',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CoreBitcoinCashTransaction, message.method, ... message.arguments);
    }
  }

  static async fromOptions(options, worker) {
    const state = await BitcoinCashTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worer, true);

    return worker ? new BitcoinCashTransaction(state, worker) : state;
  }

  static async fromJSON(json, worker) {
    const state = await BitcoinCashTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, worker, true);

    return worker ? new BitcoinCashTransaction(state, worker) : state;
  }
}
