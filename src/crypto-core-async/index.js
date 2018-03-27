const PromiseWorker = require('promise-worker');
CryptoCore = require('crypto-core');

CryptoCore.worker = new PromiseWorker(new Worker('webworker.bundle.js'));
CryptoCore.Utils = require('./lib/utils').set(CryptoCore.worker);
