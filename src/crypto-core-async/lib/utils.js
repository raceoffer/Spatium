'use strict';

import assert from 'assert';
import map from 'lodash/map';
import defaultTo from 'lodash/defaultTo';

import { wrap, unwrap } from 'crypto-core/lib/marshal';

let worker = null;

export function useWorker(_worker) {
  worker = _worker;
}

async function invokeStatic(message) {
  assert(worker);
  return unwrap(
    await worker.postMessage({
      action: 'invokeStatic',
      class: 'Utils',
      method: message.method,
      arguments: map(defaultTo(message.arguments, []), wrap)
    }));
}

export async function deriveAesKey(passwd) {
  return await invokeStatic({
    method: 'deriveAesKey',
    arguments: [passwd]
  });
}

export async function randomBytes(n) {
  return await invokeStatic({
    method: 'randomBytes',
    arguments: [n]
  });
}

export async function decrypt(ciphertext, key) {
  return await invokeStatic({
    method: 'decrypt',
    arguments: [ciphertext, key]
  });
}

export async function encrypt(buffer, key) {
  return await invokeStatic({
    method: 'encrypt',
    arguments: [buffer, key]
  });
}

export async function sha256(buffer) {
  return await invokeStatic({
    method: 'sha256',
    arguments: [buffer]
  });
}

export async function checksum(buffer) {
  return await invokeStatic({
    method: 'checksum',
    arguments: [buffer]
  });
}

export async function packSeed(seed) {
  return await invokeStatic({
    method: 'packSeed',
    arguments: [seed]
  });
}

export async function tryUnpackSeed(seed) {
  return await invokeStatic({
    method: 'tryUnpackSeed',
    arguments: [seed]
  });
}

export async function tryUnpackEncryptedSeed(seed) {
  return await invokeStatic({
    method: 'tryUnpackEncryptedSeed',
    arguments: [seed]
  });
}

export async function packMultiple(array) {
  return await invokeStatic({
    method: 'packMultiple',
    arguments: [array]
  });
}

export async function tryUnpackMultiple(buffer) {
  return await invokeStatic({
    method: 'tryUnpackMultiple',
    arguments: [buffer]
  });
}

export async function packTree(tree, seed) {
  return await invokeStatic({
    method: 'packTree',
    arguments: [tree, seed]
  });
}

export async function matchPassphrase(chiphertexts, passphase) {
  return await invokeStatic({
    method: 'matchPassphrase',
    arguments: [chiphertexts, passphase]
  });
}

export async function packLogin(login) {
  return await invokeStatic({
    method: 'packLogin',
    arguments: [login]
  });
}

export async function tryUnpackLogin(chiphertext) {
  return await invokeStatic({
    method: 'tryUnpackLogin',
    arguments: [chiphertext]
  });
}

export async function reverse(data) {
  return await invokeStatic({
    method: 'reverse',
    arguments: [data]
  });
}

export async function getAccountSecret(userId, accountId) {
  return await invokeStatic({
    method: 'getAccountSecret',
    arguments: [userId, accountId]
  });
}
