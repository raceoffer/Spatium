const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

function BitcoinTransaction(state) {
  this.state = state || { type: 'BitcoinTransaction' }
}

BitcoinTransaction.set = function(worker) {
  BitcoinTransaction.worker = worker;
  return BitcoinTransaction;
};

BitcoinTransaction.prototype.invoke = async function(message, wrapped) {
  const result = await BitcoinTransaction.worker.postMessage({
    action: 'invoke',
    class: 'BitcoinTransaction',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

BitcoinTransaction.invokeStatic = async function(message, wrapped) {
  const result = await BitcoinTransaction.worker.postMessage({
    action: 'invokeStatic',
    class: 'BitcoinTransaction',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });
  return wrapped ? result : Marshal.unwrap(result);
};

BitcoinTransaction.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

BitcoinTransaction.fromOptions = async options => new BitcoinTransaction(await BitcoinTransaction.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

BitcoinTransaction.prototype.estimateSize = async function() {
  return await this.invoke({
    method: 'estimateSize',
    arguments: []
  });
};

BitcoinTransaction.prototype.totalOutputs = async function() {
  return await this.invoke({
    method: 'totalOutputs',
    arguments: []
  });
};

BitcoinTransaction.prototype.prepare = async function(options) {
  await this.invoke({
    method: 'prepare',
    arguments: [options]
  });
};

BitcoinTransaction.prototype.toJSON = async function() {
  return await this.invoke({
    method: 'toJSON',
    arguments: []
  });
};

BitcoinTransaction.prototype.fromJSON = async function(json) {
  await this.invoke({
    method: 'fromJSON',
    arguments: [json]
  }, true);
  return this;
};

BitcoinTransaction.fromJSON = async json => new BitcoinTransaction(await BitcoinTransaction.invokeStatic({
  method: 'fromJSON',
  arguments: [json]
}, true));

BitcoinTransaction.prototype.mapInputs = async function(compoundKeys) {
  if (!_.isArray(compoundKeys)) {
    compoundKeys = [compoundKeys];
  }
  return await this.invoke({
    method: 'mapInputs',
    arguments: [_.map(compoundKeys, key => Marshal.unwrap(key.state))]
  });
};

BitcoinTransaction.prototype.getHashes = async function(mapping, sigtype) {
  return await this.invoke({
    method: 'getHashes',
    arguments: [mapping, sigtype]
  });
};

BitcoinTransaction.prototype.normalizeSignatures = async function(mapping, rawSignatures, sigtype) {
  return await this.invoke({
    method: 'normalizeSignatures',
    arguments: [mapping, rawSignatures, sigtype]
  });
};

BitcoinTransaction.prototype.applySignatures = async function(signatures) {
  await this.invoke({
    method: 'applySignatures',
    arguments: [signatures]
  });
};

BitcoinTransaction.prototype.toRaw = async function() {
  return await this.invoke({
    method: 'toRaw',
    arguments: []
  });
};

BitcoinTransaction.prototype.verify = async function() {
  return await this.invoke({
    method: 'verify',
    arguments: []
  });
};

BitcoinTransaction.prototype.startSign = async function(hashes, keyMap) {
  await this.invoke({
    method: 'startSign',
    arguments: [hashes, keyMap]
  });
};

BitcoinTransaction.prototype.createEntropyCommitments = async function() {
  return await this.invoke({
    method: 'createEntropyCommitments',
    arguments: []
  });
};

BitcoinTransaction.prototype.processEntropyCommitments = async function(commitments) {
  return await this.invoke({
    method: 'processEntropyCommitments',
    arguments: [commitments]
  });
};

BitcoinTransaction.prototype.processEntropyDecommitments = async function(decommitments) {
  await this.invoke({
    method: 'processEntropyDecommitments',
    arguments: [decommitments]
  });
};

BitcoinTransaction.prototype.computeCiphertexts = async function() {
  return await this.invoke({
    method: 'computeCiphertexts',
    arguments: []
  });
};

BitcoinTransaction.prototype.extractSignatures = async function(ciphertexts) {
  return await this.invoke({
    method: 'extractSignatures',
    arguments: [ciphertexts]
  });
};

module.exports = BitcoinTransaction;
