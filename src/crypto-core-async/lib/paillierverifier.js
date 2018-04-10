const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

function PaillierVerifier(state) {
  this.state = state || { type: 'PaillierVerifier' }
}

PaillierVerifier.set = function(worker) {
  PaillierVerifier.worker = worker;
  return PaillierVerifier;
};

PaillierVerifier.prototype.invoke = async function(message, wrapped) {
  const result = await PaillierVerifier.worker.postMessage({
    action: 'invoke',
    class: 'PaillierVerifier',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), arg => Marshal.wrap(arg, 'PaillierVerifier'))
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

PaillierVerifier.invokeStatic = async function(message, wrapped) {
  const result = await PaillierVerifier.worker.postMessage({
    action: 'invokeStatic',
    class: 'PaillierVerifier',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), arg => Marshal.wrap(arg, 'PaillierVerifier'))
  });
  return wrapped ? result : Marshal.unwrap(result);
};

PaillierVerifier.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

PaillierVerifier.fromOptions = async options => new PaillierVerifier(await PaillierVerifier.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

PaillierVerifier.prototype.getCommitment = async function() {
  return await this.invoke({
    method: 'getCommitment',
    arguments: []
  });
};

PaillierVerifier.prototype.processCommitment = async function(commitment) {
  return await this.invoke({
    method: 'processCommitment',
    arguments: [commitment]
  });
};

PaillierVerifier.prototype.processDecommitment = async function(decommitment) {
  return await this.invoke({
    method: 'processDecommitment',
    arguments: [decommitment]
  });
};

module.exports = PaillierVerifier;
