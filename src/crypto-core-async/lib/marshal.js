const _ = require('lodash');
const ec = require('elliptic').ec('secp256k1');
const BN = require('bn.js');
const jspaillier = require('jspaillier');
const BigInteger = require("jsbn").BigInteger;

const CompoundKey = require('crypto-core/lib/compoundkey');

function Marshal() {}

Marshal.wrap = function (data) {
  if (_.isUndefined(data) || data === null) {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return {
      type: 'Buffer',
      value: data.toString('hex')
    }
  }

  if (data.constructor && data.constructor.name === 'KeyPair') {
    return {
      type: 'KeyPair',
      priv: data.priv ? data.getPrivate().toString(16) : null,
      pub: data.pub ? Buffer.from(data.getPublic().encode(true)).toString('hex') : null
    }
  }

  if (data.constructor && data.constructor.name === 'BN') {
    return {
      type: 'BN',
      value: data.toString(16)
    }
  }

  if (data.constructor && data.constructor.name === 'Point') {
    return {
      type: 'Point',
      value: Buffer.from(data.encode(true)).toString('hex')
    }
  }

  if (data.constructor && data.constructor.name === 'BigInteger') {
    return {
      type: 'BigInteger',
      value: data.toString(16)
    }
  }

  if (data.constructor && data.constructor.name === 'CompoundKey') {
    return {
      type: 'CompoundKey',
      localPrivateKey: Marshal.wrap(data.localPrivateKey),
      remotePublicKey: Marshal.wrap(data.remotePublicKey),
      compoundPublicKey: Marshal.wrap(data.compoundPublicKey),
      localPaillierPublicKey: Marshal.wrap(data.localPaillierPublicKey),
      localPaillierPrivateKey: Marshal.wrap(data.localPaillierPrivateKey),
      remotePrivateCiphertext: Marshal.wrap(data.remotePrivateCiphertext),
      remotePaillierPublicKey: Marshal.wrap(data.remotePaillierPublicKey)
    }
  }

  if (_.isObject(data) && _.difference(['bits', 'n', 'n2', 'np1', 'rncache'], _.keys(data)).length === 0) {
    return {
      type: 'PaillierPublicKey',
      bits: data.bits,
      n: data.n.toString(16)
    }
  }

  if (_.isObject(data) && _.difference(['lambda', 'pubkey', 'x'], _.keys(data)).length === 0) {
    return {
      type: 'PaillierPrivateKey',
      lambda: data.lambda.toString(16),
      pubkey: Marshal.wrap(data.pubkey)
    }
  }

  if (_.isArray(data)) {
    return _.map(data, Marshal.wrap);
  }

  if (_.isObject(data)) {
    return _.mapValues(data, Marshal.wrap);
  }

  return data;
};

Marshal.unwrap = function(data) {
  if (_.isObject(data) && data.type === 'Buffer') {
    return Buffer.from(data.value, 'hex');
  }

  if (_.isObject(data) && data.type === 'KeyPair') {
    if (data.priv) {
      return ec.keyFromPrivate(new BN(data.priv, 16))
    } else if (data.pub) {
      return ec.keyFromPblic(ec.curve.decodePoint(Buffer.from(data.pub, 'hex')));
    } else {
      return null;
    }
  }

  if (_.isObject(data) && data.type === 'BN') {
    return new BN(data.value, 16);
  }

  if (_.isObject(data) && data.type === 'Point') {
    return ec.curve.decodePoint(Buffer.from(data.value, 'hex'));
  }

  if (_.isObject(data) && data.type === 'BigInteger') {
    return new BigInteger(data.value, 16);
  }

  if (_.isObject(data) && data.type === 'CompoundKey') {
    const compoundKey = new CompoundKey();
    compoundKey.localPrivateKey = Marshal.unwrap(data.localPrivateKey);
    compoundKey.remotePublicKey = Marshal.unwrap(data.remotePublicKey);
    compoundKey.compoundPublicKey = Marshal.unwrap(data.compoundPublicKey);
    compoundKey.localPaillierPublicKey = Marshal.unwrap(data.localPaillierPublicKey);
    compoundKey.localPaillierPrivateKey = Marshal.unwrap(data.localPaillierPrivateKey);
    compoundKey.remotePrivateCiphertext = Marshal.unwrap(data.remotePrivateCiphertext);
    compoundKey.remotePaillierPublicKey = Marshal.unwrap(data.remotePaillierPublicKey);
    return compoundKey;
  }

  if (_.isObject(data) && data.type === 'PaillierPublicKey') {
    return new jspaillier.publicKey(data.bits, new BigInteger(data.n, 16));
  }

  if (_.isObject(data) && data.type === 'PaillierPrivateKey') {
    return new jspaillier.privateKey(new BigInteger(data.lambda, 16), Marshal.unwrap(data.pubkey));
  }

  if (_.isArray(data)) {
    return _.map(data, Marshal.unwrap);
  }

  if (_.isObject(data)) {
    return _.mapValues(data, Marshal.unwrap);
  }

  return data;
};

module.exports = Marshal;
