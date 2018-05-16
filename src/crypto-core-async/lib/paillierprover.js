'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { PaillierVerifier } from './paillierverifier';

export class PaillierProver {
  constructor(state) {
    this.state = state || { type: 'PaillierProver' };
  }

  static useWorker(_worker) {
    PaillierProver.worker = _worker;
    PaillierVerifier.useWorker(worker);
  }

  async invoke(message, wrapped) {
    assert(PaillierProver.worker);
    const result = await PaillierProver.worker.postMessage({
      action: 'invoke',
      class: 'PaillierProver',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, wrapped) {
    assert(PaillierProver.worker);
    const result = await PaillierProver.worker.postMessage({
      action: 'invokeStatic',
      class: 'PaillierProver',
      method: message.method,
      arguments:map(defaultTo(message.arguments, []), wrap)
    });
    return wrapped ? result : unwrap(result);
  }

  async fromOptions(options) {
    await this.invoke({
      method: 'fromOptions',
      arguments: [options]
    }, true);
    return this;
  }

  static async fromOptions(options) {
    return new PaillierProver(await PaillierProver.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
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
    }, true));
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
