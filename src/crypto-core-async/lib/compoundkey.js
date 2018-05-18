'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { PaillierProver } from './paillierprover';
import { Signer } from './signer';

export class CompoundKey {
  constructor(state) {
    this.state = state || { type: 'CompoundKey' };
  }

  static useWorker(worker) {
    CompoundKey.worker = worker;
    PaillierProver.useWorker(worker);
  }

  async invoke(message, wrapped) {
    assert(CompoundKey.worker);
    const result = await CompoundKey.worker.postMessage({
      action: 'invoke',
      class: 'CompoundKey',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, wrapped) {
    assert(CompoundKey.worker);
    const result = await CompoundKey.worker.postMessage({
      action: 'invokeStatic',
      class: 'CompoundKey',
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });
    return wrapped ? result : unwrap(result);
  };

  static async generatePaillierKeys() {
    return CompoundKey.invokeStatic({
      method: 'generatePaillierKeys',
      arguments: []
    });
  }

  static async generateKey() {
    return CompoundKey.invokeStatic({
      method: 'generateKey',
      arguments: []
    });
  }

  static async generate() {
    return new CompoundKey(await CompoundKey.invokeStatic({
      method: 'generate',
      arguments: []
    }, true));
  }

  static async keyFromSecret(secret) {
    return CompoundKey.invokeStatic({
      method: 'keyFromSecret',
      arguments: [secret]
    });
  }

  static async fromSecret(secret) {
    return new CompoundKey(await CompoundKey.invokeStatic({
      method: 'fromSecret',
      arguments: [secret]
    }, true));
  }

  async fromOptions(options) {
    await this.invoke({
      method: 'fromOptions',
      arguments: [options]
    }, true);
    return this;
  }

  static async fromOptions(options) {
    return new CompoundKey(await CompoundKey.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, true));
  }

  async getPrivateKey(enc) {
    return await this.invoke({
      method: 'getPrivateKey',
      arguments: [enc]
    });
  }

  async getPublicKey(compress, enc) {
    return await this.invoke({
      method: 'getPublicKey',
      arguments: [compress, enc]
    });
  }

  async getCompoundPublicKey(compress, enc) {
    return await this.invoke({
      method: 'getCompoundPublicKey',
      arguments: [compress, enc]
    });
  }

  async startInitialCommitment() {
    return new PaillierProver(await this.invoke({
      method: 'startInitialCommitment',
      arguments: []
    }, true));
  }

  async finishInitialSync(syncData) {
    return await this.invoke({
      method: 'finishInitialSync',
      arguments: [syncData]
    });
  }

  async extractSyncData() {
    return await this.invoke({
      method: 'extractSyncData',
      arguments: []
    });
  }

  async startSign(message) {
    return new Signer(await this.invoke({
      method: 'startSign',
      arguments: [message]
    }, true));
  }
}
