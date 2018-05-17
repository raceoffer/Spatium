'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class Signer {
  constructor(state) {
    this.state = state || { type: 'Signer' };
  }

  static useWorker(worker) {
    Signer.worker = worker;
  }

  async invoke(message, wrapped) {
    assert(Signer.worker);
    const result = await Signer.worker.postMessage({
      action: 'invoke',
      class: 'Signer',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, wrapped) {
    assert(Signer.worker);
    const result = await Signer.worker.postMessage({
      action: 'invokeStatic',
      class: 'Signer',
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
    return new Signer(await Signer.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
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
