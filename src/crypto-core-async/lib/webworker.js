const registerPromiseWorker = require('promise-worker/register');
const assert = require('assert');
const _ = require('lodash');

const CryptoCore = {
  Utils: require('crypto-core/lib/utils')
};

const Marshal = require('./marshal');

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
      assert(
        _.isObject(message.self) && _.isFunction(objectClass.fromJSON),
        'message.self should be a JSON object to reconstruct ' + message.class + ' from'
      );

      const self = objectClass.fromJSON(message.self);

      assert(
          _.isString(message.method) && _.isFunction(_.get(self, message.method)),
          'message.method should be an instance method of ' + message.class
        );
      assert(
        _.isFunction(self.toJSON),
        'An instance of ' + message.class + ' should be convertible to JSON'
      );

      const result = await _.invoke(
        self,
        message.method,
        ... _.map(_.defaultTo(message.arguments, []), Marshal.unwrap)
      );

      return {
        result: Marshal.wrap(result),
        self: self.toJSON()
      };
    case 'invokeStatic':
      assert
      (
        _.isString(message.method) && _.isFunction(_.get(objectClass, message.method)),
        'message.method should be one of ' + _.keys(CryptoCore)
      );
      console.log(message.class, message.method, _.map(_.defaultTo(message.arguments, []), Marshal.unwrap));
      return Marshal.wrap(await _.invoke(
        objectClass,
        message.method,
        ... _.map(_.defaultTo(message.arguments, []), Marshal.unwrap)
      ));
  }
});
