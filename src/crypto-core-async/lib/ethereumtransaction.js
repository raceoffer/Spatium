'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class EthereumTransaction {
  constructor(state) {
    this.state = state || { type: 'EthereumTransaction' };
  }

  static useWorker(worker) {
    EthereumTransaction.worker = worker;
  }

  async invoke(message, wrapped) {
    assert(EthereumTransaction.worker);
    const result = await EthereumTransaction.worker.postMessage({
      action: 'invoke',
      class: 'EthereumTransaction',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, wrapped) {
    assert(EthereumTransaction.worker);
    const result = await EthereumTransaction.worker.postMessage({
      action: 'invokeStatic',
      class: 'EthereumTransaction',
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

  static async fromOptions(tx, data) {
    return EthereumTransaction(await EthereumTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [tx, data]
    }, true));
  }

  async estimateSize() {
    return await this.invoke({
      method: 'estimateSize',
      arguments: []
    });
  }

  async estimateFee() {
    return await this.invoke({
      method: 'estimateFee',
      arguments: []
    });
  }

  async totalOutputs() {
    return await this.invoke({
      method: 'totalOutputs',
      arguments: []
    });
  }

  async validate(address) {
    return await this.invoke({
      method: 'validate',
      arguments: [address]
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

  static async fromJSON(json) {
    return new EthereumTransaction(await EthereumTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, true));
  }

  async mapInputs(compoundKey) {
    return await this.invoke({
      method: 'mapInputs',
      arguments: [Marshal.unwrap(compoundKey.state)]
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
