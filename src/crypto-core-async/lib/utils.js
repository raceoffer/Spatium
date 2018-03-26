const PromiseWorker = require('promise-worker');
const _ = require('lodash');
const Marshal = require('./marshal');

function Utils() {}

// temporary
Utils.worker = new PromiseWorker(new Worker('webworker.bundle.js'));

Utils.invokeStatic = async message => Marshal.unwrap(
  await Utils.worker.postMessage({
    action: 'invokeStatic',
    class: 'Utils',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  }));

Utils.deriveAesKey = async passwd => Utils.invokeStatic({
  method: 'deriveAesKey',
  arguments: arguments
});

Utils.randomBytes = async n => Utils.invokeStatic({
  method: 'randomBytes',
  arguments: arguments
});

Utils.decrypt = async (ciphertext, key) => Utils.invokeStatic({
  method: 'decrypt',
  arguments: arguments
});

Utils.encrypt = async (buffer, key) => Utils.invokeStatic({
  method: 'encrypt',
  arguments: arguments
});

Utils.sha256 = async buffer => Utils.invokeStatic({
  method: 'sha256',
  arguments: arguments
});

Utils.checksum = async buffer => Utils.invokeStatic({
  method: 'checksum',
  arguments: arguments
});

Utils.packSeed = async seed => Utils.invokeStatic({
  method: 'packSeed',
  arguments: arguments
});

Utils.tryUnpackSeed = async seed => Utils.invokeStatic({
  method: 'tryUnpackSeed',
  arguments: arguments
});

Utils.tryUnpackEncryptedSeed = async seed => Utils.invokeStatic({
  method: 'tryUnpackEncryptedSeed',
  arguments: arguments
});

Utils.packMultiple = async array => Utils.invokeStatic({
  method: 'packMultiple',
  arguments: arguments
});

Utils.tryUnpackMultiple = async buffer => Utils.invokeStatic({
  method: 'tryUnpackMultiple',
  arguments: arguments
});

// remove transformer from here
Utils.packTree = async (tree, transformer, seed) => Utils.invokeStatic({
  method: 'tryUnpackMultiple',
  arguments: arguments
});

Utils.matchPassphrase = async (chiphertexts, passphase) => Utils.invokeStatic({
  method: 'matchPassphrase',
  arguments: arguments
});

Utils.packLogin = async login => Utils.invokeStatic({
  method: 'packLogin',
  arguments: arguments
});

Utils.tryUnpackLogin = async chiphertext => Utils.invokeStatic({
  method: 'tryUnpackLogin',
  arguments: arguments
});

Utils.testNetwork = async () => Utils.invokeStatic({
  method: 'testNetwork',
  arguments: arguments
});

Utils.reverse = async data => Utils.invokeStatic({
  method: 'reverse',
  arguments: arguments
});

module.exports = Utils;
