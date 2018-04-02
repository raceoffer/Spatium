const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

function EthereumTransaction(state) {
  this.state = state || { type: 'EthereumTransaction' }
}

EthereumTransaction.set = function(worker) {
  EthereumTransaction.worker = worker;
  return EthereumTransaction;
};

EthereumTransaction.prototype.invoke = async function(message, wrapped) {
  const result = await EthereumTransaction.worker.postMessage({
    action: 'invoke',
    class: 'EthereumTransaction',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

EthereumTransaction.invokeStatic = async function(message, wrapped) {
  const result = await EthereumTransaction.worker.postMessage({
    action: 'invokeStatic',
    class: 'EthereumTransaction',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });
  return wrapped ? result : Marshal.unwrap(result);
};

EthereumTransaction.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

EthereumTransaction.fromOptions = async options => new EthereumTransaction(await EthereumTransaction.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

EthereumTransaction.prototype.estimateSize = async function() {
  return await this.invoke({
    method: 'estimateSize',
    arguments: []
  });
};

EthereumTransaction.prototype.estimateFee = async function() {
  return await this.invoke({
    method: 'estimateFee',
    arguments: []
  });
};

EthereumTransaction.prototype.totalOutputs = async function() {
  return await this.invoke({
    method: 'totalOutputs',
    arguments: []
  });
};

EthereumTransaction.prototype.transferData = async function() {
  return await this.invoke({
    method: 'transferData',
    arguments: []
  });
};

EthereumTransaction.prototype.toJSON = async function() {
  return await this.invoke({
    method: 'toJSON',
    arguments: []
  });
};

EthereumTransaction.prototype.fromJSON = async function(json) {
  await this.invoke({
    method: 'fromJSON',
    arguments: [json]
  }, true);
  return this;
};

EthereumTransaction.fromJSON = async json => new EthereumTransaction(await EthereumTransaction.invokeStatic({
  method: 'fromJSON',
  arguments: [json]
}, true));

EthereumTransaction.prototype.mapInputs = async function(compoundKey) {
  return await this.invoke({
    method: 'mapInputs',
    arguments: [Marshal.unwrap(compoundKey.state)]
  });
};

EthereumTransaction.prototype.getHashes = async function(mapping, sigtype) {
  return await this.invoke({
    method: 'getHashes',
    arguments: [mapping, sigtype]
  });
};

EthereumTransaction.prototype.normalizeSignatures = async function(mapping, rawSignatures, sigtype) {
  return await this.invoke({
    method: 'normalizeSignatures',
    arguments: [mapping, rawSignatures, sigtype]
  });
};

EthereumTransaction.prototype.applySignatures = async function(signatures) {
  await this.invoke({
    method: 'applySignatures',
    arguments: [signatures]
  });
};

EthereumTransaction.prototype.toRaw = async function() {
  return await this.invoke({
    method: 'toRaw',
    arguments: []
  });
};

EthereumTransaction.prototype.verify = async function() {
  return await this.invoke({
    method: 'verify',
    arguments: []
  });
};

EthereumTransaction.prototype.startSign = async function(hashes, keyMap) {
  await this.invoke({
    method: 'startSign',
    arguments: [hashes, keyMap]
  });
};

EthereumTransaction.prototype.createEntropyCommitments = async function() {
  return await this.invoke({
    method: 'createEntropyCommitments',
    arguments: []
  });
};

EthereumTransaction.prototype.processEntropyCommitments = async function(commitments) {
  return await this.invoke({
    method: 'processEntropyCommitments',
    arguments: [commitments]
  });
};

EthereumTransaction.prototype.processEntropyDecommitments = async function(decommitments) {
  await this.invoke({
    method: 'processEntropyDecommitments',
    arguments: [decommitments]
  });
};

EthereumTransaction.prototype.computeCiphertexts = async function() {
  return await this.invoke({
    method: 'computeCiphertexts',
    arguments: []
  });
};

EthereumTransaction.prototype.extractSignatures = async function(ciphertexts) {
  return await this.invoke({
    method: 'extractSignatures',
    arguments: [ciphertexts]
  });
};

module.exports = EthereumTransaction;
