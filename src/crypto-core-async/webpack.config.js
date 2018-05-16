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
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader"
      }
    }]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
