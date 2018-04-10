const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

const BitcoreTransaction = require('./bitcoretransaction');

function BitcoinCashTransaction(state) {
  BitcoreTransaction.call(this, 'BitcoinCashTransaction', state);
}

BitcoinCashTransaction.prototype = Object.create(BitcoreTransaction.prototype);
BitcoinCashTransaction.prototype.constructor = BitcoinCashTransaction;

BitcoinCashTransaction.set = function(worker) {
  BitcoinCashTransaction.worker = worker;
  BitcoreTransaction.set(worker);
  return BitcoinCashTransaction;
};

BitcoinCashTransaction.invokeStatic = async function(message, wrapped) {
  const result = await BitcoinCashTransaction.worker.postMessage({
    action: 'invokeStatic',
    class: 'BitcoinCashTransaction',
    method: message.method,
    arguments: _.map(_.defaultTo(message.arguments, []), arg => Marshal.wrap(arg, 'BitcoinCashTransaction'))
  });
  return wrapped ? result : Marshal.unwrap(result);
};

BitcoinCashTransaction.fromOptions = async options => new BitcoinCashTransaction(await BitcoinCashTransaction.invokeStatic({
  method: 'fromOptions',
  arguments: [options]
}, true));

BitcoinCashTransaction.fromJSON = async json => new BitcoinCashTransaction(await BitcoinCashTransaction.invokeStatic({
  method: 'fromJSON',
  arguments: [json]
}, true));

module.exports = BitcoinCashTransaction;
