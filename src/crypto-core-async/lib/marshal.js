function Marshal() {}

Marshal.wrap = function (data) {
  if (Buffer.isBuffer(data)) {
    return {
      type: 'Buffer',
      value: data.toString('hex')
    }
  }

  return data;
};

Marshal.unwrap = function(data) {
  if (_.isObject(data) && data.type === 'Buffer') {
    return Buffer.from(data.value, 'hex');
  }

  return data;
};

module.exports = Marshal;
