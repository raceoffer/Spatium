const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

const BitcoreTransaction = require('./bitcoretransaction');

function BitcoinTransaction(state) {
  BitcoreTransaction.call(this, 'BitcoinTransaction', state);
}

BitcoinTransaction.prototype = Object.create(BitcoreTransaction.prototype);
BitcoinTransaction.prototype.constructor = BitcoinTransaction;

BitcoinTransaction.set = function(worker) {
  BitcoinTransaction.worker = worker;
  BitcoreTransaction.set(worker);
  return BitcoinTransaction;
};

BitcoinTransaction.invokeStatic = async function(message, wrapped) {
  const result = await BitcoreTransaction.worker.postMessage({
    action: 'invokeStatic',
    class: 'BitcoinTransaction',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), arg => Marshal.wrap(arg, 'BitcoinTransaction'))
  });
  return wrapped ? result : Marshal.unwrap(result);
};

BitcoinTransaction.fromOptions = async options => new BitcoinTransaction(await BitcoinTransaction.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

BitcoinTransaction.fromJSON = async json => new BitcoinTransaction(await BitcoinTransaction.invokeStatic({
  method: 'fromJSON',
  arguments: [json]
}, true));

module.exports = BitcoinTransaction;
