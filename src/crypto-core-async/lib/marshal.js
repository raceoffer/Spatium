const _ = require('lodash');
const ec = require('elliptic').ec('secp256k1');
const BN = require('bn.js');
const jspaillier = require('jspaillier');
const BigInteger = require("jsbn").BigInteger;

const CompoundKey = require('crypto-core/lib/compoundkey');
const PaillierProof = require('crypto-core/lib/paillierproof');
const PedersenScheme = require('crypto-core/lib/pedersenscheme');

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

  if (data.constructor && data.constructor.name === 'Prover') {
    return {
      type: 'Prover',
      pk: Marshal.wrap(data.pk),
      sk: Marshal.wrap(data.sk),
      x: Marshal.wrap(data.x),
      pedersenScheme: Marshal.wrap(data.pedersenScheme),
      remoteParams: Marshal.wrap(data.remoteParams),
      iCommitment: Marshal.wrap(data.iCommitment),
      iDecommitment: Marshal.wrap(data.iDecommitment),
      sCommitment: Marshal.wrap(data.sCommitment),
      aDecommitment: Marshal.wrap(data.aDecommitment)
    }
  }

  if (data.constructor && data.constructor.name === 'PedersenScheme') {
    return {
      type: 'PedersenScheme',
      a: Marshal.wrap(data.a),
      H: Marshal.wrap(data.H)
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

  console.log('wrap', data, data.constructor.name);

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

  if (_.isObject(data) && data.type === 'Prover') {
    const prover = new PaillierProof.Prover();
    prover.pk = Marshal.unwrap(data.pk);
    prover.sk = Marshal.unwrap(data.sk);
    prover.x = Marshal.unwrap(data.x);
    prover.pedersenScheme = Marshal.unwrap(data.pedersenScheme);
    prover.remoteParams = Marshal.unwrap(data.remoteParams);
    prover.iCommitment = Marshal.unwrap(data.iCommitment);
    prover.iDecommitment = Marshal.unwrap(data.iDecommitment);
    prover.sCommitment = Marshal.unwrap(data.sCommitment);
    prover.aDecommitment = Marshal.unwrap(data.aDecommitment);
    return prover;
  }

  if (_.isObject(data) && data.type === 'PedersenScheme') {
    const pedersenScheme = new PedersenScheme();
    pedersenScheme.a = Marshal.unwrap(data.a);
    pedersenScheme.H = Marshal.unwrap(data.H);
    return pedersenScheme;
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
