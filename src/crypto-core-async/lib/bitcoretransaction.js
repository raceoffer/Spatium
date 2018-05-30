'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';
import isArray from 'lodash/isArray';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class BitcoreTransaction {
  constructor(subclass, state, worker) {
    this.subclass = subclass;
    this.state = state || { type: this.subclass };
    this.worker = worker || null;
  }

  async invoke(message, wrapped) {
    assert(this.worker);
    const result = await this.worker.postMessage({
      action: 'invoke',
      class: this.subclass,
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  async fromOptions(options) {
    await this.invoke({
      method: 'fromOptions',
      arguments: [options]
    }, true);
    return this;
  }

  async estimateSize() {
    return await this.invoke({
      method: 'estimateSize',
      arguments: []
    });
  }

  async totalOutputs() {
    return await this.invoke({
      method: 'totalOutputs',
      arguments: []
    });
  }

  async estimateFee() {
    return await this.invoke({
      method: 'estimateFee',
      arguments: []
    });
  }

  async validate(address) {
    return await this.invoke({
      method: 'validate',
      arguments: [address]
    });
  }

  async prepare(options) {
    await this.invoke({
      method: 'prepare',
      arguments: [options]
    });
  }

  async toJSON() {
    return await this.invoke({
      method: 'toJSON',
      arguments: []
    });
  }

  async fromJSON(json) {
    await this.invoke({
      method: 'fromJSON',
      arguments: [json]
    }, true);
    return this;
  }

  async mapInputs(compoundKeys) {
    if (!isArray(compoundKeys)) {
      compoundKeys = [compoundKeys];
    }
    return await this.invoke({
      method: 'mapInputs',
      arguments: [map(compoundKeys, key => unwrap(key.state))]
    });
  }

  async getHashes(mapping, sigtype) {
    return await this.invoke({
      method: 'getHashes',
      arguments: [mapping, sigtype]
    });
  }

  async normalizeSignatures(mapping, rawSignatures, sigtype) {
    return await this.invoke({
      method: 'normalizeSignatures',
      arguments: [mapping, rawSignatures, sigtype]
    });
  }

  async applySignatures(signatures) {
    await this.invoke({
      method: 'applySignatures',
      arguments: [signatures]
    });
  }

  async toRaw() {
    return await this.invoke({
      method: 'toRaw',
      arguments: []
    });
  }

  async verify() {
    return await this.invoke({
      method: 'verify',
      arguments: []
    });
  }

  async startSign(hashes, keyMap) {
    await this.invoke({
      method: 'startSign',
      arguments: [hashes, keyMap]
    });
  }

  async createEntropyCommitments() {
    return await this.invoke({
      method: 'createEntropyCommitments',
      arguments: []
    });
  }

  async processEntropyCommitments(commitments) {
    return await this.invoke({
      method: 'processEntropyCommitments',
      arguments: [commitments]
    });
  }

  async processEntropyDecommitments(decommitments) {
    await this.invoke({
      method: 'processEntropyDecommitments',
      arguments: [decommitments]
    });
  }

  async computeCiphertexts() {
    return await this.invoke({
      method: 'computeCiphertexts',
      arguments: []
    });
  }

  async extractSignatures(ciphertexts) {
    return await this.invoke({
      method: 'extractSignatures',
      arguments: [ciphertexts]
    });
  }
}
