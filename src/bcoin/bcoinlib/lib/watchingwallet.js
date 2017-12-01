const bcoin = require('bcoin');
const BlockMeta = require("bcoin/lib/wallet/records").BlockMeta;
const EventEmitter = require('events');
const assert = require("assert");

function WatchingWallet(options) {
    if(!(this instanceof WatchingWallet))
        return new WatchingWallet(options);

    EventEmitter.call(this);

    this.walletId  = 'main';
    this.accountId = null;
    this.watchingKey = [];
    this.wallet = null;
    this.account = null;

    if(options) {
        this.fromOptions(options);
    }
}

Object.setPrototypeOf(WatchingWallet.prototype, EventEmitter.prototype);

WatchingWallet.prototype.load = async function load(db) {
    this.wallet = await db.ensure({
        id: this.walletId,
        watchOnly: true
    });

    this.wallet.on('tx',(tx)=>{
        this.emit('transaction',tx);
    });

    this.wallet.on('balance',async ()=>{
        let balance = await this.getBalance();
        this.emit('balance',balance);
    });

    this.account = await this.wallet.ensureAccount({
        name: this.accountId
    });

    if (!await this.wallet.getPath(this.watchingKey.getHash('hex'))) {
        await this.wallet.importKey(this.accountId, this.watchingKey);
    }

    return this;
};

WatchingWallet.prototype.getAddress = function getAddress(enc) {
    return this.watchingKey.getKeyAddress(enc);
};

WatchingWallet.prototype.getBalance = async function getBalance() {
    return await this.wallet.getBalance(this.accountId);
};

WatchingWallet.prototype.addRawTransaction = async function addRawTransaction(hex,meta) {
    const transaction = bcoin.tx.fromRaw(hex,'hex');
    const block = meta.hash ? new BlockMeta(meta.hash, meta.height, bcoin.util.time(meta.time)) : null;
    await this.wallet.add(transaction, block);
};

WatchingWallet.prototype.getCoins = async function getCoins() {
    return await this.wallet.getCoins(this.accountId);
};

WatchingWallet.prototype.fromOptions = function fromOptions(options) {
    assert(options.watchingKey, "a public key is required");
    this.watchingKey = options.watchingKey;
    this.accountId = this.watchingKey.getKeyAddress('base58');

    return this;
};

WatchingWallet.fromOptions = function fromOptions(db, options) {
    return new WatchingWallet(db).fromOptions(options);
};

module.exports = WatchingWallet;