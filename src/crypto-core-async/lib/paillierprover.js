const _ = require('lodash');
const Marshal = require('./marshal');

const PaillierVerifier = require('./paillierverifier');

function PaillierProver(state) {
  this.state = state || { type: 'PaillierProver' }
}

PaillierProver.set = function(worker) {
  PaillierProver.worker = worker;
  PaillierVerifier.set(worker);
  return PaillierProver;
};

PaillierProver.prototype.invoke = async function(message, wrapped) {
  const result = await PaillierProver.worker.postMessage({
    action: 'invoke',
    class: 'PaillierProver',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

PaillierProver.invokeStatic = async function(message, wrapped) {
  const result = await PaillierProver.worker.postMessage({
    action: 'invokeStatic',
    class: 'PaillierProver',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });
  return wrapped ? result : Marshal.unwrap(result);
};

PaillierProver.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

PaillierProver.fromOptions = async options => new PaillierProver(await PaillierProver.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

PaillierProver.prototype.getInitialCommitment = async function() {
  return await this.invoke({
    method: 'getInitialCommitment',
    arguments: []
  });
};

PaillierProver.prototype.processInitialCommitment = async function(commitment) {
  return await this.invoke({
    method: 'processInitialCommitment',
    arguments: [commitment]
  });
};

PaillierProver.prototype.processInitialDecommitment = async function(decommitment) {
  return new PaillierVerifier(await this.invoke({
    method: 'processInitialDecommitment',
    arguments: [decommitment]
  }, true));
};

PaillierProver.prototype.processCommitment = async function(commitment) {
  return await this.invoke({
    method: 'processCommitment',
    arguments: [commitment]
  });
};

PaillierProver.prototype.processDecommitment = async function(decommitment) {
  return await this.invoke({
    method: 'processDecommitment',
    arguments: [decommitment]
  });
};

module.exports = PaillierProver;
