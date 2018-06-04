'use strict';

const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'webworker.js'),
  devtool: 'source-map',
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
