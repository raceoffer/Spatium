import { CurrencyId } from '../services/currencyinfo.service';

const logos = {
  [CurrencyId.Bitcoin]: {
    logo: 'assets/images/drawable/currency/bitcoin.svg',
    tokenLogos: {}
  },
  [CurrencyId.Litecoin]: {
    logo: 'assets/images/drawable/currency/litecoin.svg',
    tokenLogos: {}
  },
  [CurrencyId.BitcoinCash]: {
    logo: 'assets/images/drawable/currency/bitcoin-cash.svg',
    tokenLogos: {}
  },
  [CurrencyId.Ethereum]: {
    logo: 'assets/images/drawable/currency/ethereum.svg',
    tokenLogos: {
      '0xf230b790e05390fc8295f4d3f60332c93bed42e2': 'assets/images/drawable/currency/tron.svg',
      '0xd850942ef8811f2a866692a623011bde52a462c1': 'assets/images/drawable/currency/ven.svg',
      '0xb5a5f22694352c15b00323844ad545abb2b11028': 'assets/images/drawable/currency/icon.svg',
      '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07': 'assets/images/drawable/currency/omisego.svg',
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 'assets/images/drawable/currency/binance-coin.svg',
      '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a': 'assets/images/drawable/currency/digix-dao.svg',
      '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a': 'assets/images/drawable/currency/populous.svg',
      '0x168296bb09e24a88805cb9c33356536b980d3fc5': 'assets/images/drawable/currency/rchain.svg',
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': 'assets/images/drawable/currency/maker.svg',
      '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d': 'assets/images/drawable/currency/aeternity.svg',
      '0xe94327d07fc17907b4db788e5adf2ed424addff6': 'assets/images/drawable/currency/augur.svg',
      '0x744d70fdbe2ba4cf95131626614a1763df805b9e': 'assets/images/drawable/currency/status.svg',
      '0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750': 'assets/images/drawable/currency/bytom.svg',
      '0x4CEdA7906a5Ed2179785Cd3A40A69ee8bc99C466': 'assets/images/drawable/currency/aion.svg',
      '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74': 'assets/images/drawable/currency/waltonchain.svg',
      '0xe41d2489571d322189246dafa5ebde1f4699f498': 'assets/images/drawable/currency/0x.svg',
      '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27': 'assets/images/drawable/currency/zilliqa.svg',
      '0x039b5649a59967e3e936d7471f9c3700100ee1ab': 'assets/images/drawable/currency/kucoin-shares.svg',
      '0x8f3470A7388c05eE4e7AF3d01D8C722b0FF52374': 'assets/images/drawable/currency/veritaseum.svg',
      '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6': 'assets/images/drawable/currency/qash.svg',
      '0xEF68e7C694F40c8202821eDF525dE3782458639f': 'assets/images/drawable/currency/loopring.svg',
      '0x5af2be193a6abca9c8817001f45744777db30756': 'assets/images/drawable/currency/ethos.svg',
      '0xa74476443119A942dE498590Fe1f2454d7D4aC0d': 'assets/images/drawable/currency/golem.svg',
      '0x5d65d971895edc438f465c17db6992698a52318d': 'assets/images/drawable/currency/nebulas.svg',
      '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e': 'assets/images/drawable/currency/dragonchain.svg',
      '0x0d8775f648430679a709e98d2b0cb6250d2887ef': 'assets/images/drawable/currency/basic-attention-token.svg',
      '0x48f775efbe4f5ece6e0df2f7b5932df56823b990': 'assets/images/drawable/currency/revain.svg',
      '0x419d0d8bdd9af5e606ae2232ed285aff190e711b': 'assets/images/drawable/currency/funfair.svg',
      '0xdd974d5c2e2928dea5f71b9825b8b646686bd200': 'assets/images/drawable/currency/kyber-network.svg',
      '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab': 'assets/images/drawable/currency/iostoken.svg',
      '0xbf2179859fc6D5BEE9Bf9158632Dc51678a4100e': 'assets/images/drawable/currency/aelf.svg',
      '0x8f8221afbb33998d8584a2b05749ba73c37a938a': 'assets/images/drawable/currency/request-network.svg',
      '0x4156D3342D5c385a87D264F90653733592000581': 'assets/images/drawable/currency/salt.svg',
      '0x514910771af9ca656af840dff83e8264ecf986ca': 'assets/images/drawable/currency/chainlink.svg',
      '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec': 'assets/images/drawable/currency/polymath.svg',
      '0x595832f8fc6bf59c85c527fec3740a1b7a361269': 'assets/images/drawable/currency/power-ledger.svg',
      '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5': 'assets/images/drawable/currency/kin.svg',
      '0x08d32b0da63e2C3bcF8019c9c5d849d7a9d791e6': 'assets/images/drawable/currency/dentacoin.svg',
      '0x809826cceab68c387726af962713b64cb5cb3cca': 'assets/images/drawable/currency/no-image.svg',
      '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c': 'assets/images/drawable/currency/bancor.svg',
      '0xB97048628DB6B661D4C2aA833e95Dbe1A905B280': 'assets/images/drawable/currency/tenx.svg',
      '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4': 'assets/images/drawable/currency/enigma.svg',
      '0xd4c435f5b09f855c3317c8524cb1f586e42795fa': 'assets/images/drawable/currency/cindicator.svg',
      '0x960b236A07cf122663c4303350609A66A7B288C0': 'assets/images/drawable/currency/aragon.svg',
      '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac': 'assets/images/drawable/currency/storj.svg',
      '0xb91318f35bdb262e9423bc7c7c2a3a93dd93c92c': 'assets/images/drawable/currency/nuls.svg',
      '0x888666CA69E0f178DED6D75b5726Cee99A87D698': 'assets/images/drawable/currency/iconomi.svg',
      '0x3597bfd533a99c9aa083587b074434e61eb0a258': 'assets/images/drawable/currency/dent.svg',
      '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433': 'assets/images/drawable/currency/storm.svg',
      '0xe3818504c1b32bf1557b16c238b2e01fd3149c17': 'assets/images/drawable/currency/pillar.svg',
      '0xF433089366899D83a9f26A773D59ec7eCF30355e': 'assets/images/drawable/currency/metal.svg',
      '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d': 'assets/images/drawable/currency/quantstamp.svg',
      '0x12480e24eb5bec1a9d4369cab6a80cad3c0a377a': 'assets/images/drawable/currency/substratum.svg',
      '0x6810e776880c02933d47db1b9fc05908e5386b96': 'assets/images/drawable/currency/gnosis.svg',
      '0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25': 'assets/images/drawable/currency/sirin-labs-token.svg',
      '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': 'assets/images/drawable/currency/decentraland.svg',
      '0x103c3a209da59d3e7c4a89307e66521e081cfdf0': 'assets/images/drawable/currency/genesis-vision.svg',
      '0x41e5560054824ea6b0732e656e3ad64e20e94e45': 'assets/images/drawable/currency/civic.svg',
      '0xd234bf2410a0009df9c3c63b610c09738f18ccd7': 'assets/images/drawable/currency/dynamic-trading-rights.svg',
      '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c': 'assets/images/drawable/currency/enjin-coin.svg',
      '0x8eb24319393716668d768dcec29356ae9cffe285': 'assets/images/drawable/currency/singularity-net.svg',
      '0x3883f5e181fccaF8410FA61e12b59BAd963fb645': 'assets/images/drawable/currency/theta-token.svg',
      '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d': 'assets/images/drawable/currency/monaco.svg',
      '0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098': 'assets/images/drawable/currency/santiment-network-token.svg',
      '0x607F4C5BB672230e8672085532f7e901544a7375': 'assets/images/drawable/currency/iexec-rlc.svg',
      '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6': 'assets/images/drawable/currency/raiden-network-token.svg',
      '0xf7920b0768ecb20a123fac32311d07d193381d6f': 'assets/images/drawable/currency/time-new-bank.svg',
      '0x6ec8a24cabdc339a06a172f8223ea557055adaa5': 'assets/images/drawable/currency/genaro-network.svg',
      '0x46b9ad944d1059450da1163511069c718f699d31': 'assets/images/drawable/currency/no-image.svg',
      '0x39Bb259F66E1C59d5ABEF88375979b4D20D98022': 'assets/images/drawable/currency/wax.svg',
      '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195': 'assets/images/drawable/currency/poet.svg',
      '0xb3104b4b9da82025e8b9f8fb28b3553ce2f67069': 'assets/images/drawable/currency/bibox-token.svg',
      '0xb98d4c97425d9908e66e53a6fdf673acca0be986': 'assets/images/drawable/currency/arcblock.svg',
      '0x90528aeb3a2b736b780fd1b6c478bb7e1d643170': 'assets/images/drawable/currency/xpa.svg',
      '0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2': 'assets/images/drawable/currency/high-performance-blockchain.svg',
      '0x20e94867794dba030ee287f1406e100d03c84cd3': 'assets/images/drawable/currency/dew.svg',
      '0xc42209aCcC14029c1012fB5680D95fBd6036E2a0': 'assets/images/drawable/currency/pay-pie.svg',
      '0x1844b21593262668b7248d0f57a220caaba46ab9': 'assets/images/drawable/currency/oyster.svg',
      '0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c': 'assets/images/drawable/currency/edgeless.svg',
      '0xd780ae2bf04cd96e577d3d014762f831d97129d0': 'assets/images/drawable/currency/envion.svg',
      '0xd0352a019e9ab9d757776f532377aaebd36fd541': 'assets/images/drawable/currency/fusion.svg',
      '0x622dFfCc4e83C64ba959530A5a5580687a57581b': 'assets/images/drawable/currency/no-image.svg',
      '0x3833dda0aeb6947b98ce454d89366cba8cc55528': 'assets/images/drawable/currency/sophia-tx.svg',
      '0x4470bb87d77b963a013db939be332f927f2b992e': 'assets/images/drawable/currency/adex.svg',
      '0x66186008C1050627F979d464eABb258860563dbE': 'assets/images/drawable/currency/medishares.svg',
      '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03': 'assets/images/drawable/currency/ethlend.svg',
      '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca': 'assets/images/drawable/currency/ost.svg',
      '0x5732046a883704404f284ce41ffadd5b007fd668': 'assets/images/drawable/currency/bluzelle.svg',
      '0x26e75307fc0c021472feb8f727839531f112f317': 'assets/images/drawable/currency/no-image.svg',
      '0x5e6b6d9abad9093fdc861ea1600eba1b355cd940': 'assets/images/drawable/currency/no-image.svg',
      '0x5102791ca02fc3595398400bfe0e33d7b6c82267': 'assets/images/drawable/currency/no-image.svg',
      '0xced4e93198734ddaff8492d525bd258d49eb388e': 'assets/images/drawable/currency/eidoo.svg',
      '0x340d2bde5eb28c1eed91b2f790723e3b160613b7': 'assets/images/drawable/currency/blockv.svg',
      '0xf85feea2fdd81d51177f6b8f35f0e6734ce45f5f': 'assets/images/drawable/currency/no-image.svg',
      '0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6': 'assets/images/drawable/currency/ripio-credit-network.svg',
      '0x85e076361cc813a908ff672f9bad1541474402b2': 'assets/images/drawable/currency/telcoin.svg',
      '0xe8ff5c9c75deb346acac493c463c8950be03dfba': 'assets/images/drawable/currency/vibe.svg',
      '0x983f6d60db79ea8ca4eb9968c6aff8cfa04b3c63': 'assets/images/drawable/currency/sonm.svg',
      '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0': 'assets/images/drawable/currency/loom-network.svg',
      '0xe7775a6e9bcf904eb39da2b68c5efb4f9360e08c': 'assets/images/drawable/currency/taas.svg',
      '0x667088b212ce3d06a1b553a7221E1fD19000d9aF': 'assets/images/drawable/currency/wings.svg',
      '0xd53370acf66044910bb49cbcfe8f3cd020337f60': 'assets/images/drawable/currency/consensus.svg'
    }
  },
  [CurrencyId.Nem]: {
    logo: 'assets/images/drawable/currency/nem.svg',
    tokenLogos: {}
  },
  [CurrencyId.Neo]: {
    logo: 'assets/images/drawable/currency/neo.svg',
    tokenLogos: {}
  },
  [CurrencyId.BitcoinTest]: {
    logo: 'assets/images/drawable/currency/bitcoin.svg',
    tokenLogos: {}
  },
  [CurrencyId.LitecoinTest]: {
    logo: 'assets/images/drawable/currency/litecoin.svg',
    tokenLogos: {}
  },
  [CurrencyId.BitcoinCashTest]: {
    logo: 'assets/images/drawable/currency/bitcoin-cash.svg',
    tokenLogos: {}
  },
  [CurrencyId.EthereumTest]: {
    logo: 'assets/images/drawable/currency/ethereum.svg',
    tokenLogos: {}
  },
  [CurrencyId.NemTest]: {
    logo: 'assets/images/drawable/currency/nem.svg',
    tokenLogos: {}
  },
  [CurrencyId.NeoTest]: {
    logo: 'assets/images/drawable/currency/neo.svg',
    tokenLogos: {}
  }
};

const missing = 'assets/images/drawable/currency/no-image.svg';

export function getCurrencyLogo(id: CurrencyId) {
  const logo = logos[id];
  return logo ? logo.logo : missing;
}

export function getTokenLogo(id: CurrencyId, tokenId: string) {
  const logo = logos[id];
  const token = logo ? logo.tokenLogos[tokenId] : missing;
  return token || missing;
}
