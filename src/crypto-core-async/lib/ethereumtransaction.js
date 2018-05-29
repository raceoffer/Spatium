'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { EthereumTransaction as CoreEthereumTransaction } from 'crypto-core/lib/transaction/ethereumtransaction';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

export class EthereumTransaction {
  constructor(state, worker) {
    this.state = state || { type: 'EthereumTransaction' };
    this.worker = worker || null;
  }

  async invoke(message, wrapped) {
    assert(this.worker);
    const result = await this.worker.postMessage({
      action: 'invoke',
      class: 'EthereumTransaction',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, worker, wrapped) {
    if (worker) {
      const result = await EthereumTransaction.worker.postMessage({
        action: 'invokeStatic',
        class: 'EthereumTransaction',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CoreEthereumTransaction, message.method, ... message.arguments);
    }
  }

  async fromOptions(tx, data) {
    await this.invoke({
      method: 'fromOptions',
      arguments: [tx, data]
    }, true);
    return this;
  }

  static async fromOptions(tx, data, worker) {
    const state = await EthereumTransaction.invokeStatic({
      method: 'fromOptions',
      arguments: [tx, data]
    }, worker, true);

    return worker ? new EthereumTransaction(state, worker) : state;
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

  static async fromJSON(json, worker) {
    const state = await EthereumTransaction.invokeStatic({
      method: 'fromJSON',
      arguments: [json]
    }, worker, true);

    return worker ? new EthereumTransaction(state, worker) : state;
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
