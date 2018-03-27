const _ = require('lodash');
const Marshal = require('./marshal');

function CompoundKey(state) {
  this.state = state || { type: 'CompoundKey' }
}

CompoundKey.set = function(worker) {
  CompoundKey.worker = worker;
  return CompoundKey;
};

CompoundKey.prototype.invoke = async function(message) {
  const result = await CompoundKey.worker.postMessage({
    action: 'invoke',
    class: 'CompoundKey',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return Marshal.unwrap(result.result);
};

CompoundKey.prototype.invokeSelf = async function(message) {
  const result = await CompoundKey.worker.postMessage({
    action: 'invoke',
    class: 'CompoundKey',
    self: this.state,
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });

  this.state = result.self;

  return this;
};

CompoundKey.invokeStatic = async message =>
  Marshal.unwrap(await CompoundKey.worker.postMessage({
    action: 'invokeStatic',
    class: 'CompoundKey',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  }));

CompoundKey.invokeStaticSelf = async message =>
  new CompoundKey(await CompoundKey.worker.postMessage({
    action: 'invokeStatic',
    class: 'CompoundKey',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  }));

CompoundKey.generatePaillierKeys = async () => CompoundKey.invokeStatic({
  method: 'generatePaillierKeys',
  arguments: []
});

CompoundKey.generateKey = async () => CompoundKey.invokeStatic({
  method: 'generateKey',
  arguments: []
});

CompoundKey.generate = async () => CompoundKey.invokeStaticSelf({
  method: 'generate',
  arguments: []
});

CompoundKey.keyFromSecret = async secret => CompoundKey.invokeStatic({
  method: 'keyFromSecret',
  arguments: [secret]
});

CompoundKey.fromSecret = async secret => CompoundKey.invokeStaticSelf({
  method: 'fromSecret',
  arguments: [secret]
});

CompoundKey.prototype.fromOptions = async function(options) {
  return this.invokeSelf({
    method: 'fromOptions',
    arguments: [options]
  });
};

CompoundKey.fromOptions = options => CompoundKey.invokeStaticSelf({
  method: 'fromOptions',
  arguments: [options]
});

CompoundKey.prototype.getPrivateKey = async function(enc) {
  return this.invoke({
    method: 'getPrivateKey',
    arguments: [enc]
  });
};

CompoundKey.prototype.getPublicKey = async function(compress, enc) {
  return this.invoke({
    method: 'getPublicKey',
    arguments: [compress, enc]
  });
};

CompoundKey.prototype.getCompoundPublicKey = async function(compress, enc) {
  return this.invoke({
    method: 'getCompoundPublicKey',
    arguments: [compress, enc]
  });
};

CompoundKey.prototype.startInitialCommitment = async function() {
  return this.invoke({
    method: 'startInitialCommitment',
    arguments: []
  });
};

CompoundKey.prototype.finishInitialSync = async function(syncData) {
  return this.invoke({
    method: 'finishInitialSync',
    arguments: [syncData]
  });
};

CompoundKey.prototype.extractSyncData = async function() {
  return this.invoke({
    method: 'extractSyncData',
    arguments: []
  });
};

module.exports = CompoundKey;
