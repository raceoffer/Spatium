const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

function BitcoreTransaction(subclass, state) {
  this.subclass = subclass;
  this.state = state || { type: this.subclass }
}

BitcoreTransaction.set = function(worker) {
  BitcoreTransaction.worker = worker;
  return BitcoreTransaction;
};

BitcoreTransaction.prototype.invoke = async function(message, wrapped) {
  const result = await BitcoreTransaction.worker.postMessage({
    action: 'invoke',
    class: this.subclass,
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), arg => Marshal.wrap(arg, this.subclass))
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

BitcoreTransaction.invokeStatic = async function(message, wrapped) {
  const result = await BitcoreTransaction.worker.postMessage({
    action: 'invokeStatic',
    class: 'BitcoreTransaction',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), arg => Marshal.wrap(arg, 'BitcoreTransaction'))
  });
  return wrapped ? result : Marshal.unwrap(result);
};

BitcoreTransaction.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

BitcoreTransaction.fromOptions = async options => new BitcoreTransaction(await BitcoreTransaction.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

BitcoreTransaction.prototype.estimateSize = async function() {
  return await this.invoke({
    method: 'estimateSize',
    arguments: []
  });
};

BitcoreTransaction.prototype.totalOutputs = async function() {
  return await this.invoke({
    method: 'totalOutputs',
    arguments: []
  });
};

BitcoreTransaction.prototype.estimateFee = async function() {
  return await this.invoke({
    method: 'estimateFee',
    arguments: []
  });
};

BitcoreTransaction.prototype.validate = async function(address) {
  return await this.invoke({
    method: 'validate',
    arguments: [address]
  });
};

BitcoreTransaction.prototype.prepare = async function(options) {
  await this.invoke({
    method: 'prepare',
    arguments: [options]
  });
};

BitcoreTransaction.prototype.toJSON = async function() {
  return await this.invoke({
    method: 'toJSON',
    arguments: []
  });
};

BitcoreTransaction.prototype.fromJSON = async function(json) {
  await this.invoke({
    method: 'fromJSON',
    arguments: [json]
  }, true);
  return this;
};

BitcoreTransaction.fromJSON = async json => new BitcoreTransaction(await BitcoreTransaction.invokeStatic({
  method: 'fromJSON',
  arguments: [json]
}, true));

BitcoreTransaction.prototype.mapInputs = async function(compoundKeys) {
  if (!_.isArray(compoundKeys)) {
    compoundKeys = [compoundKeys];
  }
  return await this.invoke({
    method: 'mapInputs',
    arguments: [_.map(compoundKeys, key => Marshal.unwrap(key.state))]
  });
};

BitcoreTransaction.prototype.getHashes = async function(mapping, sigtype) {
  return await this.invoke({
    method: 'getHashes',
    arguments: [mapping, sigtype]
  });
};

BitcoreTransaction.prototype.normalizeSignatures = async function(mapping, rawSignatures, sigtype) {
  return await this.invoke({
    method: 'normalizeSignatures',
    arguments: [mapping, rawSignatures, sigtype]
  });
};

BitcoreTransaction.prototype.applySignatures = async function(signatures) {
  await this.invoke({
    method: 'applySignatures',
    arguments: [signatures]
  });
};

BitcoreTransaction.prototype.toRaw = async function() {
  return await this.invoke({
    method: 'toRaw',
    arguments: []
  });
};

BitcoreTransaction.prototype.verify = async function() {
  return await this.invoke({
    method: 'verify',
    arguments: []
  });
};

BitcoreTransaction.prototype.startSign = async function(hashes, keyMap) {
  await this.invoke({
    method: 'startSign',
    arguments: [hashes, keyMap]
  });
};

BitcoreTransaction.prototype.createEntropyCommitments = async function() {
  return await this.invoke({
    method: 'createEntropyCommitments',
    arguments: []
  });
};

BitcoreTransaction.prototype.processEntropyCommitments = async function(commitments) {
  return await this.invoke({
    method: 'processEntropyCommitments',
    arguments: [commitments]
  });
};

BitcoreTransaction.prototype.processEntropyDecommitments = async function(decommitments) {
  await this.invoke({
    method: 'processEntropyDecommitments',
    arguments: [decommitments]
  });
};

BitcoreTransaction.prototype.computeCiphertexts = async function() {
  return await this.invoke({
    method: 'computeCiphertexts',
    arguments: []
  });
};

BitcoreTransaction.prototype.extractSignatures = async function(ciphertexts) {
  return await this.invoke({
    method: 'extractSignatures',
    arguments: [ciphertexts]
  });
};

module.exports = BitcoreTransaction;
