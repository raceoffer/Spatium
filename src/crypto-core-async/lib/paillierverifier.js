'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class PaillierVerifier {
  constructor(state) {
    this.state = state || { type: 'PaillierVerifier' };
  }

  static useWorker(_worker) {
    PaillierVerifier.worker = _worker;
  }

  async invoke(message, wrapped) {
    assert(PaillierVerifier.worker);
    const result = await PaillierVerifier.worker.postMessage({
      action: 'invoke',
      class: 'PaillierVerifier',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, wrapped) {
    assert(PaillierVerifier.worker);
    const result = await PaillierVerifier.worker.postMessage({
      action: 'invokeStatic',
      class: 'PaillierVerifier',
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
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
    return new PaillierVerifier(await PaillierVerifier.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
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
