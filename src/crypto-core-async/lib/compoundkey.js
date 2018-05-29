'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import { CompoundKey as CoreCompoundKey } from 'crypto-core/lib/primitives/compoundkey';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

import { PaillierProver } from './paillierprover';
import { Signer } from './signer';

export class CompoundKey {
  constructor(state, worker) {
    this.state = state || { type: 'CompoundKey' };
    this.worker = worker || null;
  }

  async invoke(message, wrapped) {
    assert(this.worker);
    const result = await this.worker.postMessage({
      action: 'invoke',
      class: 'CompoundKey',
      self: this.state,
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    });

    this.state = result.self;

    return wrapped ? result.result : unwrap(result.result);
  }

  static async invokeStatic(message, worker, wrapped) {
    if (worker) {
      const result = await CompoundKey.worker.postMessage({
        action: 'invokeStatic',
        class: 'CompoundKey',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      });
      return wrapped ? result : unwrap(result);
    } else {
      return _invoke(CoreCompoundKey, message.method, ... message.arguments);
    }
  };

  static async generatePaillierKeys(worker) {
    return CompoundKey.invokeStatic({
      method: 'generatePaillierKeys',
      arguments: []
    }, worker);
  }

  static async generateKey(worker) {
    return CompoundKey.invokeStatic({
      method: 'generateKey',
      arguments: []
    }, worker);
  }

  static async generate(worker) {
    const state = await CompoundKey.invokeStatic({
      method: 'generate',
      arguments: []
    }, worker, true);

    return worker ? new CompoundKey(state, worker) : state;
  }

  static async keyFromSecret(secret, worker) {
    return CompoundKey.invokeStatic({
      method: 'keyFromSecret',
      arguments: [secret]
    }, worker);
  }

  static async fromSecret(secret) {
    const state = await CompoundKey.invokeStatic({
      method: 'fromSecret',
      arguments: [secret]
    }, worker, true);

    return worker ? new CompoundKey(state, worker) : state;
  }

  async fromOptions(options) {
    await this.invoke({
      method: 'fromOptions',
      arguments: [options]
    }, true);
    return this;
  }

  static async fromOptions(options) {
    const state = await CompoundKey.invokeStatic({
      method: 'fromOptions',
      arguments: [options]
    }, worker, true);

    return worker ? new CompoundKey(state, worker) : state;
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
