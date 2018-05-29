'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { default as _invoke } from 'lodash/invoke';
import * as CoreUtils from 'crypto-core/lib/utils';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

async function invokeStatic(message, worker) {
  if (worker) {
    return unwrap(
      await worker.postMessage({
        action: 'invokeStatic',
        class: 'Utils',
        method: message.method,
        arguments: map(defaultTo(message.arguments, []), wrap)
      }));
  } else {
    return _invoke(CoreUtils, message.method, ... message.arguments);
  }
}

export async function deriveAesKey(passwd, worker) {
  return await invokeStatic({
    method: 'deriveAesKey',
    arguments: [passwd]
  }, worker);
}

export async function randomBytes(n, worker) {
  return await invokeStatic({
    method: 'randomBytes',
    arguments: [n]
  }, worker);
}

export async function decrypt(ciphertext, key, worker) {
  return await invokeStatic({
    method: 'decrypt',
    arguments: [ciphertext, key]
  }, worker);
}

export async function encrypt(buffer, key, worker) {
  return await invokeStatic({
    method: 'encrypt',
    arguments: [buffer, key]
  }, worker);
}

export async function sha256(buffer, worker) {
  return await invokeStatic({
    method: 'sha256',
    arguments: [buffer]
  }, worker);
}

export async function checksum(buffer, worker) {
  return await invokeStatic({
    method: 'checksum',
    arguments: [buffer]
  }, worker);
}

export async function packSeed(seed, worker) {
  return await invokeStatic({
    method: 'packSeed',
    arguments: [seed]
  }, worker);
}

export async function tryUnpackSeed(seed, worker) {
  return await invokeStatic({
    method: 'tryUnpackSeed',
    arguments: [seed]
  }, worker);
}

export async function tryUnpackEncryptedSeed(seed, worker) {
  return await invokeStatic({
    method: 'tryUnpackEncryptedSeed',
    arguments: [seed]
  }, worker);
}

export async function packMultiple(array, worker) {
  return await invokeStatic({
    method: 'packMultiple',
    arguments: [array]
  }, worker);
}

export async function tryUnpackMultiple(buffer, worker) {
  return await invokeStatic({
    method: 'tryUnpackMultiple',
    arguments: [buffer]
  }, worker);
}

export async function packTree(tree, seed, worker) {
  return await invokeStatic({
    method: 'packTree',
    arguments: [tree, seed]
  }, worker);
}

export async function matchPassphrase(chiphertexts, passphase, worker) {
  return await invokeStatic({
    method: 'matchPassphrase',
    arguments: [chiphertexts, passphase]
  }, worker);
}

export async function packLogin(login, worker) {
  return await invokeStatic({
    method: 'packLogin',
    arguments: [login]
  }, worker);
}

export async function tryUnpackLogin(chiphertext, worker) {
  return await invokeStatic({
    method: 'tryUnpackLogin',
    arguments: [chiphertext]
  }, worker);
}

export async function reverse(data, worker) {
  return await invokeStatic({
    method: 'reverse',
    arguments: [data]
  }, worker);
}

export async function getAccountSecret(userId, accountId, worker) {
  return await invokeStatic({
    method: 'getAccountSecret',
    arguments: [userId, accountId]
  }, worker);
}
