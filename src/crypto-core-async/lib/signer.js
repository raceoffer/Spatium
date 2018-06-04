'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { Signer as CoreSigner } from 'crypto-core/lib/primitives/signer';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class Signer {
  constructor(state, worker) {
    this.state = state || { type: 'Signer' };
    this.worker = worker || null;
  }

  async invoke(message, wrapped) {
    assert(this.worker);
    const result = await this.worker.postMessage({
      action: 'invoke',
      class: 'Signer',
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
        class: 'Signer',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CoreSigner, message.method, ... message.arguments);
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
    const state = await Signer.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worker, true);

    return worker ? new Signer(state, worker) : state;
  }

  async createEntropyCommitment() {
    return await this.invoke({
      method: 'createEntropyCommitment',
      arguments: []
    });
  };

  async processEntropyCommitment(commitment) {
    return await this.invoke({
      method: 'processEntropyCommitment',
      arguments: [commitment]
    });
  }

  async processEntropyDecommitment(decommitment) {
    await this.invoke({
      method: 'processEntropyDecommitment',
      arguments: [decommitment]
    });
  }

  async computeCiphertext() {
    return await this.invoke({
      method: 'computeCiphertext',
      arguments: []
    });
  }

  async extractSignature(ciphertext) {
    return await this.invoke({
      method: 'extractSignature',
      arguments: [ciphertext]
    });
  }
}
