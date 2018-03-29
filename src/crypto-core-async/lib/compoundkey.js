const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

const PaillierProver = require('./paillierprover');

function CompoundKey(state) {
  this.state = state || { type: 'CompoundKey' }
}

CompoundKey.set = function(worker) {
  CompoundKey.worker = worker;
  PaillierProver.set(worker);
  return CompoundKey;
};

CompoundKey.prototype.invoke = async function(message, wrapped) {
  const result = await CompoundKey.worker.postMessage({
    action: 'invoke',
    class: 'CompoundKey',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return wrapped ? result.result : Marshal.unwrap(result.result);
};

CompoundKey.invokeStatic = async function(message, wrapped) {
  const result = await CompoundKey.worker.postMessage({
    action: 'invokeStatic',
    class: 'CompoundKey',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });
  return wrapped ? result : Marshal.unwrap(result);
};

CompoundKey.generatePaillierKeys = async () => CompoundKey.invokeStatic({
  method: 'generatePaillierKeys',
  arguments: []
});

CompoundKey.generateKey = async () => CompoundKey.invokeStatic({
  method: 'generateKey',
  arguments: []
});

CompoundKey.generate = async () => new CompoundKey(await CompoundKey.invokeStatic({
  method: 'generate',
  arguments: []
}, true));

CompoundKey.keyFromSecret = async secret => CompoundKey.invokeStatic({
  method: 'keyFromSecret',
  arguments: [secret]
});

CompoundKey.fromSecret = async secret => new CompoundKey(await CompoundKey.invokeStatic({
  method: 'fromSecret',
  arguments: [secret]
}, true));

CompoundKey.prototype.fromOptions = async function(options) {
  await this.invoke({
    method: 'fromOptions',
    arguments: [options]
  }, true);
  return this;
};

CompoundKey.fromOptions = async options => new CompoundKey(await CompoundKey.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

CompoundKey.prototype.getPrivateKey = async function(enc) {
  return await this.invoke({
    method: 'getPrivateKey',
    arguments: [enc]
  });
};

CompoundKey.prototype.getPublicKey = async function(compress, enc) {
  return await this.invoke({
    method: 'getPublicKey',
    arguments: [compress, enc]
  });
};

CompoundKey.prototype.getCompoundPublicKey = async function(compress, enc) {
  return await this.invoke({
    method: 'getCompoundPublicKey',
    arguments: [compress, enc]
  });
};

CompoundKey.prototype.startInitialCommitment = async function() {
  return new PaillierProver(await this.invoke({
    method: 'startInitialCommitment',
    arguments: []
  }, true));
};

CompoundKey.prototype.finishInitialSync = async function(syncData) {
  return await this.invoke({
    method: 'finishInitialSync',
    arguments: [syncData]
  });
};

CompoundKey.prototype.extractSyncData = async function() {
  return await this.invoke({
    method: 'extractSyncData',
    arguments: []
  });
};

module.exports = CompoundKey;
