const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

function Signer(state) {
  this.state = state || { type: 'Signer' }
}

Signer.set = function(worker) {
  Signer.worker = worker;
  return Signer;
};

Signer.prototype.invoke = async function(message, wrapped) {
  const result = await Signer.worker.postMessage({
    action: 'invoke',
    class: 'Signer',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

Signer.invokeStatic = async function(message, wrapped) {
  const result = await Signer.worker.postMessage({
    action: 'invokeStatic',
    class: 'Signer',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });
  return wrapped ? result : Marshal.unwrap(result);
};

Signer.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

Signer.fromOptions = async options => new Signer(await Signer.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

Signer.prototype.createEntropyCommitment = async function() {
  return await this.invoke({
    method: 'createEntropyCommitment',
    arguments: []
  });
};

Signer.prototype.processEntropyCommitment = async function(commitment) {
  return await this.invoke({
    method: 'processEntropyCommitment',
    arguments: [commitment]
  });
};

Signer.prototype.processEntropyDecommitment = async function(decommitment) {
  await this.invoke({
    method: 'processEntropyDecommitment',
    arguments: [decommitment]
  });
};

Signer.prototype.computeCiphertext = async function() {
  return await this.invoke({
    method: 'computeCiphertext',
    arguments: []
  });
};

Signer.prototype.extractSignature = async function(ciphertext) {
  return await this.invoke({
    method: 'extractSignature',
    arguments: [ciphertext]
  });
};

module.exports = Signer;
