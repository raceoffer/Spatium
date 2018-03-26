const _ = require('lodash');

function Marshal() {}

Marshal.wrap = function (data) {
  if (Buffer.isBuffer(data)) {
    return {
      type: 'Buffer',
      value: data.toString('hex')
    }
  }

  if (_.isArray(data)) {
    return _.map(data, Marshal.wrap);
  }

  if (_.isObject(data) && data.type !== 'Buffer') {
    return _.mapValues(data, Marshal.wrap);
  }

  return data;
};

Marshal.unwrap = function(data) {
  if (_.isObject(data) && data.type === 'Buffer') {
    return Buffer.from(data.value, 'hex');
  }

  if (_.isArray(data)) {
    return _.map(data, Marshal.unwrap);
  }

  if (_.isObject(data) && data.type !== 'Buffer') {
    return _.mapValues(data, Marshal.unwrap);
  }

  return data;
};

module.exports = Marshal;
