'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { PaillierProver as CorePaillierProver } from 'crypto-core/lib/primitives/paillierprover';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { PaillierVerifier } from './paillierverifier';

export class PaillierProver {
  constructor(state, worker) {
    this.state = state || { type: 'PaillierProver' };
    this.worker = worker || null;
  }

  async invoke(message, wrapped) {
    assert(this.worker);
    const result = await this.worker.postMessage({
      action: 'invoke',
      class: 'PaillierProver',
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
        class: 'PaillierProver',
        method: message.method,
        arguments:map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CorePaillierProver, message.method, ... message.arguments);
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
    const state = await PaillierProver.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worker, true);

    return worker ? new PaillierProver(state, worker) : state;
  }

  async getInitialCommitment() {
    return await this.invoke({
      method: 'getInitialCommitment',
      arguments: []
    });
  }

  async processInitialCommitment(commitment) {
    return await this.invoke({
      method: 'processInitialCommitment',
      arguments: [commitment]
    });
  }

  async processInitialDecommitment(decommitment) {
    return new PaillierVerifier(await this.invoke({
      method: 'processInitialDecommitment',
      arguments: [decommitment]
    }, true), this.worker);
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
