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
    modules: ['node_modules'],
    extensions: ['-browser.js', '.js', '.json']
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
  plugins: [],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
