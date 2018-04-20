'use strict';

const config = require('./webpack.config');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

config.plugins.push(new UglifyJsPlugin());

module.exports = config;