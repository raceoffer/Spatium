const bcoin = require('bcoin').set('testnet');
const fs = require('fs');
const assert = require("assert");

const bcoinLib = require('..');

const WatchingWallet = bcoinLib.watchingWallet;
const BlockCypherProvider = bcoinLib.blockCypherProvider;

const walletdb = new bcoin.walletdb({
    db: 'leveldb',
    location: 'test'
});

(async () => {
    // This one should be a partial private key
    let key = null;
    if(fs.existsSync('keystore.key')) {
        key = bcoin.keyring.fromSecret(fs.readFileSync('keystore.key',"utf-8"));
    } else {
        key = bcoin.keyring.generate();
        fs.writeFileSync('keystore.key',key.toSecret(),"utf-8");
    }
    console.log(key.getKeyAddress('base58'));

    // Start: configuring a wallet

    await walletdb.open();

    // The wallet is intended to watch over the full public key
    const wallet = await new WatchingWallet({
        watchingKey: bcoin.keyring.fromPublic(key.getPublicKey())
    }).load(walletdb);

    wallet.on('transaction',(tx)=>{
        console.log(tx);
    });

    wallet.on('balance', (balance)=>{
        console.log('Balance:', bcoin.amount.btc(balance.confirmed), '(', bcoin.amount.btc(balance.unconfirmed), ')');
    });

    // End: configuring a wallet

    // Start: configuring a provider
    const provider = new BlockCypherProvider();

    provider.on('rawTransaction',async (hex,meta)=>{
        await wallet.addRawTransaction(hex,meta);
    });

    setInterval(async ()=>{
        await provider.pullTransactions(wallet.getAddress('base58'));
    },5000);

    // End: configuring a provider

    // Displaying an initial (loaded from db) balance
    const balance = await wallet.getBalance();
    console.log('Balance:', bcoin.amount.btc(balance.confirmed), '(', bcoin.amount.btc(balance.unconfirmed), ')');

    // Start: sending a TX

    const coins = await wallet.getCoins();

    let mtx = new bcoin.mtx({
        outputs: [{
            address: 'mm31V6dbjh3L66KhTg2FCEU64ofyhNJ6fD',
            value: 10000000
        }]
    });

    await mtx.fund(coins,{
        changeAddress: key.getKeyAddress('base58')
    });

    await mtx.sign(key);

    const tx = mtx.toTX();

    assert(tx.verify(mtx.view));

    await provider.pushTransaction(tx.toRaw().toString('hex'));

    // End: sending a TX
})();