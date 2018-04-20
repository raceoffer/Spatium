const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

const BitcoreTransaction = require('./bitcoretransaction');

function LitecoinTransaction(state) {
  BitcoreTransaction.call(this, 'LitecoinTransaction', state);
}

LitecoinTransaction.prototype = Object.create(BitcoreTransaction.prototype);
LitecoinTransaction.prototype.constructor = LitecoinTransaction;

LitecoinTransaction.set = function(worker) {
  LitecoinTransaction.worker = worker;
  BitcoreTransaction.set(worker);
  return LitecoinTransaction;
};

LitecoinTransaction.invokeStatic = async function(message, wrapped) {
  const result = await LitecoinTransaction.worker.postMessage({
    action: 'invokeStatic',
    class: 'LitecoinTransaction',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), Marshal.wrap)
  });
  return wrapped ? result : Marshal.unwrap(result);
};

LitecoinTransaction.fromOptions = async options => new LitecoinTransaction(await LitecoinTransaction.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

LitecoinTransaction.fromJSON = async json => new LitecoinTransaction(await LitecoinTransaction.invokeStatic({
  method: 'fromJSON',
  arguments: [json]
}, true));

module.exports = LitecoinTransaction;
