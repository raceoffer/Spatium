const _ = require('lodash');
const Marshal = require('./marshal');

function Utils(worker) {
  Utils.worker = worker;
  return Utils;
}

Utils.invokeStatic = async message => Marshal.unwrap(
  await Utils.worker.postMessage({
    action: 'invokeStatic',
    class: 'Utils',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  }));

Utils.deriveAesKey = async passwd => Utils.invokeStatic({
  method: 'deriveAesKey',
  arguments: [passwd]
});

Utils.randomBytes = async n => Utils.invokeStatic({
  method: 'randomBytes',
  arguments: [n]
});

Utils.decrypt = async (ciphertext, key) => Utils.invokeStatic({
  method: 'decrypt',
  arguments: [ciphertext, key]
});

Utils.encrypt = async (buffer, key) => Utils.invokeStatic({
  method: 'encrypt',
  arguments: [buffer, key]
});

Utils.sha256 = async buffer => Utils.invokeStatic({
  method: 'sha256',
  arguments: [buffer]
});

Utils.checksum = async buffer => Utils.invokeStatic({
  method: 'checksum',
  arguments: [buffer]
});

Utils.packSeed = async seed => Utils.invokeStatic({
  method: 'packSeed',
  arguments: [seed]
});

Utils.tryUnpackSeed = async seed => Utils.invokeStatic({
  method: 'tryUnpackSeed',
  arguments: [seed]
});

Utils.tryUnpackEncryptedSeed = async seed => Utils.invokeStatic({
  method: 'tryUnpackEncryptedSeed',
  arguments: [seed]
});

Utils.packMultiple = async array => Utils.invokeStatic({
  method: 'packMultiple',
  arguments: [array]
});

Utils.tryUnpackMultiple = async buffer => Utils.invokeStatic({
  method: 'tryUnpackMultiple',
  arguments: [buffer]
});

Utils.packTree = async (tree, seed) => Utils.invokeStatic({
  method: 'tryUnpackMultiple',
  arguments: [tree, seed]
});

Utils.matchPassphrase = async (chiphertexts, passphase) => Utils.invokeStatic({
  method: 'matchPassphrase',
  arguments: [chiphertexts, passphase]
});

Utils.packLogin = async login => Utils.invokeStatic({
  method: 'packLogin',
  arguments: [login]
});

Utils.tryUnpackLogin = async chiphertext => Utils.invokeStatic({
  method: 'tryUnpackLogin',
  arguments: [chiphertext]
});

Utils.testNetwork = async () => Utils.invokeStatic({
  method: 'testNetwork',
  arguments: []
});

Utils.reverse = async data => Utils.invokeStatic({
  method: 'reverse',
  arguments: [data]
});

module.exports = Utils;
