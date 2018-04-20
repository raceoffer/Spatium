const PromiseWorker = require('promise-worker');

CryptoCore = require('crypto-core');

CryptoCore.worker = new PromiseWorker(new Worker('webworker.bundle.js'));
CryptoCore.Utils = require('./lib/utils').set(CryptoCore.worker);
CryptoCore.CompoundKey = require('./lib/compoundkey').set(CryptoCore.worker);
CryptoCore.BitcoinTransaction = require('./lib/bitcointransaction').set(CryptoCore.worker);
CryptoCore.BitcoinCashTransaction = require('./lib/bitcoincashtransaction').set(CryptoCore.worker);
CryptoCore.LitecoinTransaction = require('./lib/litecointransaction').set(CryptoCore.worker);
CryptoCore.EthereumTransaction = require('./lib/ethereumtransaction').set(CryptoCore.worker);
