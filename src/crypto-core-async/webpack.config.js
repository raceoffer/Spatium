'use strict';

const path = require('path');

module.exports = {
  entry: './lib/webworker.js',
  output: {
    path: __dirname,
    filename: 'webworker.bundle.js'
  },
  resolve: {
    modules: ['node_modules']
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
