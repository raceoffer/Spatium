'use strict';

const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    'index': './index.js',
	  'webworker': './lib/webworker.js'
  },
  output: {
    path: __dirname,
    filename: '[name].bundle.js'
  },
  resolve: {
    modules: [path.resolve(__dirname, "node_modules/crypto-core/node_modules"), 'node_modules'],
    extensions: ['-browser.js', '.js', '.json']
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
