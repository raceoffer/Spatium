const registerPromiseWorker = require('promise-worker/register');
const assert = require('assert');
const _ = require('lodash');

const Marshal = require('crypto-core/lib/marshal');

const CryptoCore = {
  Utils: require('crypto-core/lib/utils'),
  CompoundKey: require('crypto-core/lib/primitives/compoundkey'),
  PaillierProver: require('crypto-core/lib/primitives/paillierprover'),
  PaillierVerifier: require('crypto-core/lib/primitives/paillierverifier'),
  Signer: require('crypto-core/lib/primitives/signer'),
  BitcoinTransaction: require('crypto-core/lib/transaction/bitcore/bitcointransaction'),
  BitcoinCashTransaction: require('crypto-core/lib/transaction/bitcore/bitcoincashtransaction'),
  LitecoinTransaction: require('crypto-core/lib/transaction/bitcore/litecointransaction'),
  EthereumTransaction: require('crypto-core/lib/transaction/ethereum/ethereumtransaction')
};

registerPromiseWorker(async message => {
  assert(
    _.isString(message.action) && _.includes(['invoke', 'invokeStatic'], message.action),
    'message.action should be one of [\'invoke\', \'invokeStatic\']'
  );
  assert(
    _.isString(message.class) && _.has(CryptoCore, message.class),
    'message.class should be one of ' + _.keys(CryptoCore)
  );

  const objectClass = _.get(CryptoCore, message.class);

  switch(message.action) {
    case 'invoke':
      const self = Marshal.unwrap(message.self);

      assert(
        _.isString(message.method) && _.isFunction(_.get(self, message.method)),
        'message.method should be an instance method of ' + message.class
      );

      const result = await _.invoke(
        self,
        message.method,
        ... _.map(_.defaultTo(message.arguments, []), Marshal.unwrap)
      );

      return {
        result: Marshal.wrap(result, message.class),
        self: Marshal.wrap(self, message.class)
      };
    case 'invokeStatic':
      assert(
        _.isString(message.method) && _.isFunction(_.get(objectClass, message.method)),
        'message.method should be one of ' + _.keys(CryptoCore)
      );

      return Marshal.wrap(await _.invoke(
        objectClass,
        message.method,
        ... _.map(_.defaultTo(message.arguments, []), Marshal.unwrap)
      ), message.class);
  }
});
