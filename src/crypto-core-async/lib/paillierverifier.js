'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { PaillierVerifier as CorePaillierVerifier } from 'crypto-core/lib/primitives/paillierverifier';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class PaillierVerifier {
  constructor(state, worker) {
    this.state = state || { type: 'PaillierVerifier' };
    this.worker = worker || null;
  }

  async invoke(message, wrapped) {
    assert(this.worker);
    const result = await this.worker.postMessage({
      action: 'invoke',
      class: 'PaillierVerifier',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, worker, wrapped) {
    if (worker) {
      const result = await worker.postMessage({
        action: 'invokeStatic',
        class: 'PaillierVerifier',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CorePaillierVerifier, message.method, ... message.arguments);
    }
  }

  async fromOptions(options) {
    await this.invoke({
      method: 'fromOptions',
      arguments: [options]
    }, true);
    return this;
  }

  static async fromOptions(options, worker) {
    const state = await PaillierVerifier.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worker, true);

    return worker ? new PaillierVerifier(state, worker) : state;
  }

  async getCommitment() {
    return await this.invoke({
      method: 'getCommitment',
      arguments: []
    });
  }

  async processCommitment(commitment) {
    return await this.invoke({
      method: 'processCommitment',
      arguments: [commitment]
    });
  }

  async processDecommitment(decommitment) {
    return await this.invoke({
      method: 'processDecommitment',
      arguments: [decommitment]
    });
  }
}
