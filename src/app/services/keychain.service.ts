import { Injectable } from '@angular/core';
import { KeyChain } from 'crypto-core-async';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';

export enum Coin {
  BTC = 0,
  BTC_test = 1,
  LTC = 2,
  NEM = 43,
  ETH = 60,
  XRP = 144,
  BCH = 145,
  XLM = 148,
  NEO = 888,
  ADA = 1815,
  NEO_test = 889
}

export enum Token {
  EDC = 56145,
  EOS = 56146,
  TRON = 56147,
  VECHAIN = 56148,
  ICON = 56149,
  OMNISEGO = 56150,
  BINANCECOIN = 56151,
  DIGIXDAO = 56152,
  POPULOUS = 56153,
  RCHAIN = 56154,
  MAKER = 56155,
  AETHERNITY = 56156,
  AUGUR = 56157,
  STATUS = 56158,
  BYTOM = 56159,
  AION = 56160,
  WALTONCHAIN = 56161,
  OX = 56162,
  ZILLIQA = 56163,
  KUCOIN_SHARES = 56164,
  VERITASEUM = 56165,
  QASH = 56166,
  LOOPRING = 56167,
  ETHOS = 56168,
  GOLEM = 56169,
  NEBULAS = 56170,
  DRAGONCHAIN = 56171,
  BASIC_ATTENTION_TOKEN = 56172,
  REVAIN = 56173,
  FUNFAIR = 56174,
  KYBER_NETWORK = 56175,
  IOSTOKEN = 56176,
  AELF = 56177,
  REQUEST_NETWORK = 56178,
  SALT = 56179,
  CHAINLINK = 56180,
  POLYMATH = 56181,
  POWER_LEDGER = 56182,
  KIN = 56183,
  DENTACOIN = 56184,
  NUCLEUS_VISION = 56185,
  BANCOR = 56186,
  TENX = 56187,
  ENIGMA = 56188,
  CINDICATOR = 56189,
  ARAGON = 56190,
  STORJ = 56191,
  NULS = 56192,
  ICONOMI = 56193,
  DENT = 56194,
  STORM = 56195,
  PILLAR = 56196,
  METAL = 56197,
  QUANTSTAMP = 56198,
  SUBSTRATUM = 56199,
  GNOSIS = 56200,
  SIRIN_LABS_TOKEN = 56201,
  DECENTRALAND = 56202,
  GENESIS_VISION = 56203,
  CIVIC = 56204,
  DYNAMIC_TRADING_RIGHTS = 56205,
  ENJIN_COIN = 56206,
  SINGULARITYNET = 56207,
  THETA_TOKEN = 56208,
  MONACO = 56209,
  SANTIMENT_NETWORK_TOKEN = 56210,
  IEXEC_RLC = 56211,
  RAIDEN_NETWORK_TOKEN = 56212,
  TIME_NEW_BANK = 56213,
  GENARO_NETWORK = 56214,
  CREDITS = 56215,
  WAX = 56216,
  POET = 56217,
  BIBOX_TOKEN = 56218,
  ARCBLOCK = 56219,
  XPA = 56220,
  HIGH_PERFOMANCE_BLOCKCHAIN = 56221,
  DEW = 56222,
  PAYPIE = 56223,
  OYSTER = 56224,
  EDGELESS = 56225,
  ENVION = 56226,
  FUSION = 56227,
  CUBE = 56228,
  SOPHIATX = 56229,
  ADEX = 56230,
  MEDISHARES = 56231,
  ETHLEND = 56232,
  OST = 56233,
  BLUZELLE = 56234,
  CRYPTO20 = 56235,
  IOT_CHAIN = 56236,
  LEADCOIN = 56237,
  EIDOO = 56238,
  BLOCKV = 56239,
  CYBERMILES = 56240,
  RIPIO_CREDIT_NETWORK = 56241,
  TELCOIN = 56242,
  VIBE = 56243,
  SONM = 56244,
  LOOM_NETWORK = 56245,
  TAAS = 56246,
  WINGS = 56247,
  CONSENSUS = 56248
}

export class TokenEntry {
  token: Token | number;
  name: string;
  ico: string;
  contractAddress: string;
  className: string;
  decimals: number;
  network: string;

  private static tokenKeys = Object.values(Token).filter(t => typeof Token[t] === 'number');
  private static tokenValues = TokenEntry.tokenKeys.map(k => parseInt(Token[k]));
  private static customStartId = Math.max(...TokenEntry.tokenValues) + 1;

  constructor(token: Token, name: string, ico: string, contractAddress: string, className: string,
              decimals: number = 18, network: string = 'main') {
    if (token == null) {
      this.token = TokenEntry.customStartId;
      TokenEntry.customStartId++;
    } else {
      this.token = token;
    }
    this.name = name;
    this.ico = ico;
    this.contractAddress = contractAddress;
    this.className = className || 'no-image';
    this.decimals = decimals || 18;
    this.network = network;
  }
}

@Injectable()
export class KeyChainService {
  public topTokens = new BehaviorSubject<TokenEntry[]>([
    new TokenEntry(Token.EOS, 'EOS', 'EOS', '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0', 'eos', 18),
    new TokenEntry(Token.TRON, 'TRON', 'TRX', '0xf230b790e05390fc8295f4d3f60332c93bed42e2', 'tron', 6),
    new TokenEntry(Token.VECHAIN, 'VeChain', 'VEN', '0xd850942ef8811f2a866692a623011bde52a462c1', 'veChain', 18),
    new TokenEntry(Token.ICON, 'ICON', 'ICX', '0xb5a5f22694352c15b00323844ad545abb2b11028', 'icon', 18),
    new TokenEntry(Token.OMNISEGO, 'OmiseGO', 'OMG', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', 'omiseGO', 18),
    new TokenEntry(Token.BINANCECOIN, 'Binance Coin', 'BN', '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 'binanceCoin', 18),
    new TokenEntry(Token.DIGIXDAO, 'DigixDAO', 'DGD', '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a', 'digixDAO', 9),
    new TokenEntry(Token.POPULOUS, 'Populous', 'PPT', '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a', 'populous', 8),
    new TokenEntry(Token.RCHAIN, 'RChain', 'RHOC', '0x168296bb09e24a88805cb9c33356536b980d3fc5', 'rchain', 8),
    new TokenEntry(Token.MAKER, 'Maker', 'MKR', '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', 'maker', 18),
    new TokenEntry(Token.AETHERNITY, 'Aeternity', 'AE', '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d', 'aeternity', 18),
    new TokenEntry(Token.AUGUR, 'Augur', 'REP', '0xe94327d07fc17907b4db788e5adf2ed424addff6', 'augur', 18),
    new TokenEntry(Token.STATUS, 'Status', 'SNT', '0x744d70fdbe2ba4cf95131626614a1763df805b9e', 'status', 18),
    new TokenEntry(Token.BYTOM, 'Bytom', 'BTM', '0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750', 'bytom', 8),
    new TokenEntry(Token.AION, 'Aion', 'AION', '0x4CEdA7906a5Ed2179785Cd3A40A69ee8bc99C466', 'aion', 8),
    new TokenEntry(Token.WALTONCHAIN, 'Waltonchain', 'WTC', '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74', 'waltonchain', 18),
    new TokenEntry(Token.OX, '0x', 'ZRX', '0xe41d2489571d322189246dafa5ebde1f4699f498', 'ox', 3),
    new TokenEntry(Token.ZILLIQA, 'Zilliqa', 'ZIL', '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27', 'zilliqa', 12),
    new TokenEntry(Token.KUCOIN_SHARES, 'KuCoin Shares', 'KCS', '0x039b5649a59967e3e936d7471f9c3700100ee1ab', 'kuCoinShares', 6),
    new TokenEntry(Token.VERITASEUM, 'Veritaseum', 'VERI', '0x8f3470A7388c05eE4e7AF3d01D8C722b0FF52374', 'veritaseum', 18),
    new TokenEntry(Token.QASH, 'QASH', 'QASH', '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6', 'qash', 6),
    new TokenEntry(Token.LOOPRING, 'Loopring', 'LRC', '0xEF68e7C694F40c8202821eDF525dE3782458639f', 'loopring', 18),
    new TokenEntry(Token.ETHOS, 'Ethos', 'ETHOS', '0x5af2be193a6abca9c8817001f45744777db30756', 'ethos', 8),
    new TokenEntry(Token.GOLEM, 'Golem', 'GNT', '0xa74476443119A942dE498590Fe1f2454d7D4aC0d', 'golem', 18),
    new TokenEntry(Token.NEBULAS, 'Nebulas', 'NAS', '0x5d65d971895edc438f465c17db6992698a52318d', 'nebulas', 18),
    new TokenEntry(Token.DRAGONCHAIN, 'Dragonchain', 'DRGN', '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e', 'dragonchain', 18),
    new TokenEntry(Token.BASIC_ATTENTION_TOKEN, 'Basic Attention Token', 'BAT', '0x0d8775f648430679a709e98d2b0cb6250d2887ef', 'basicAttentionToken', 18),
    new TokenEntry(Token.REVAIN, 'Revain', 'R', '0x48f775efbe4f5ece6e0df2f7b5932df56823b990', 'revain', 0),
    new TokenEntry(Token.FUNFAIR, 'FunFair', 'FUN', '0x419d0d8bdd9af5e606ae2232ed285aff190e711b', 'funFair', 8),
    new TokenEntry(Token.KYBER_NETWORK, 'Kyber Network', 'KNC', '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', 'kyberNetwork', 18),
    new TokenEntry(Token.IOSTOKEN, 'IOStoken', 'IOST', '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab', 'iostoken', 18),
    new TokenEntry(Token.AELF, 'aelf', 'ELF', '0xbf2179859fc6D5BEE9Bf9158632Dc51678a4100e', 'aelf', 18),
    new TokenEntry(Token.REQUEST_NETWORK, 'Request Network', 'REQ', '0x8f8221afbb33998d8584a2b05749ba73c37a938a', 'requestNetwork', 18),
    new TokenEntry(Token.SALT, 'SALT', 'SALT', '0x4156D3342D5c385a87D264F90653733592000581', 'salt', 8),
    new TokenEntry(Token.CHAINLINK, 'ChainLink', 'LINK', '0x514910771af9ca656af840dff83e8264ecf986ca', 'chainLink', 18),
    new TokenEntry(Token.POLYMATH, 'Polymath', 'POLY', '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec', 'polymath', 18),
    new TokenEntry(Token.POWER_LEDGER, 'Power Ledger', 'POWR', '0x595832f8fc6bf59c85c527fec3740a1b7a361269', 'powerLedger', 6),
    new TokenEntry(Token.KIN, 'Kin', 'KIN', '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5', 'kin', 18),
    new TokenEntry(Token.DENTACOIN, 'Dentacoin', 'DCN', '0x08d32b0da63e2C3bcF8019c9c5d849d7a9d791e6', 'dentacoin', 0),
    new TokenEntry(Token.NUCLEUS_VISION, 'Nucleus Vision', 'NCASH', '0x809826cceab68c387726af962713b64cb5cb3cca', 'nucleusVision', 18),
    new TokenEntry(Token.BANCOR, 'Bancor', 'BNT', '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c', 'bancor', 18),
    new TokenEntry(Token.TENX, 'TenX', 'PAY', '0xB97048628DB6B661D4C2aA833e95Dbe1A905B280', 'tenx', 18),
    new TokenEntry(Token.ENIGMA, 'Enigma', 'ENG', '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4', 'enigma', 8),
    new TokenEntry(Token.CINDICATOR, 'Cindicator', 'CND', '0xd4c435f5b09f855c3317c8524cb1f586e42795fa', 'cindicator', 18),
    new TokenEntry(Token.ARAGON, 'Aragon', 'ANT', '0x960b236A07cf122663c4303350609A66A7B288C0', 'aragon', 18),
    new TokenEntry(Token.STORJ, 'Storj', 'STORJ', '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac', 'storj', 8),
    new TokenEntry(Token.NULS, 'Nuls', 'NULS', '0xb91318f35bdb262e9423bc7c7c2a3a93dd93c92c', 'nuls', 18),
    new TokenEntry(Token.ICONOMI, 'Iconomi', 'ICN', '0x888666CA69E0f178DED6D75b5726Cee99A87D698', 'iconomi', 18),
    new TokenEntry(Token.DENT, 'Dent', 'DENT', '0x3597bfd533a99c9aa083587b074434e61eb0a258', 'dent', 8),
    new TokenEntry(Token.STORM, 'Storm', 'STORM', '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433', 'storm', 18),
    new TokenEntry(Token.PILLAR, 'Pillar', 'PLR', '0xe3818504c1b32bf1557b16c238b2e01fd3149c17', 'pillar', 18),
    new TokenEntry(Token.METAL, 'Metal', 'MTL', '0xF433089366899D83a9f26A773D59ec7eCF30355e', 'metal', 8),
    new TokenEntry(Token.QUANTSTAMP, 'Quantstamp', 'QSP', '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d', 'quantstamp', 18),
    new TokenEntry(Token.SUBSTRATUM, 'Substratum', 'SUB', '0x12480e24eb5bec1a9d4369cab6a80cad3c0a377a', 'substratum', 2),
    new TokenEntry(Token.GNOSIS, 'Gnosis', 'GNO', '0x6810e776880c02933d47db1b9fc05908e5386b96', 'gnosis', 18),
    new TokenEntry(Token.SIRIN_LABS_TOKEN, 'SIRIN LABS Token', 'SRN', '0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25', 'sirinLabsToken', 18),
    new TokenEntry(Token.DECENTRALAND, 'Decentraland', 'MANA', '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', 'decentraland', 18),
    new TokenEntry(Token.GENESIS_VISION, 'Genesis Vision', 'GVT', '0x103c3a209da59d3e7c4a89307e66521e081cfdf0', 'genesisVision', 18),
    new TokenEntry(Token.CIVIC, 'Civic', 'CVC', '0x41e5560054824ea6b0732e656e3ad64e20e94e45', 'civic', 8),
    new TokenEntry(Token.DYNAMIC_TRADING_RIGHTS, 'Dynamic Trading Rights', 'DTR', '0xd234bf2410a0009df9c3c63b610c09738f18ccd7', 'dynamicTradingRights', 8),
    new TokenEntry(Token.ENJIN_COIN, 'Enjin Coin', 'ENJ', '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c', 'enjinCoin', 18),
    new TokenEntry(Token.SINGULARITYNET, 'SingularityNET', 'AGI', '0x8eb24319393716668d768dcec29356ae9cffe285', 'singularityNET', 8),
    new TokenEntry(Token.THETA_TOKEN, 'Theta Token', 'THETA', '0x3883f5e181fccaF8410FA61e12b59BAd963fb645', 'thetaToken', 18),
    new TokenEntry(Token.MONACO, 'Monaco', 'MCO', '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d', 'monaco', 8),
    new TokenEntry(Token.SANTIMENT_NETWORK_TOKEN, 'Santiment Network Token', 'SAN', '0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098', 'santimentNetworkToken', 18),
    new TokenEntry(Token.IEXEC_RLC, 'iExec RLC', 'RLC', '0x607F4C5BB672230e8672085532f7e901544a7375', 'iExecRLC', 9),
    new TokenEntry(Token.RAIDEN_NETWORK_TOKEN, 'Raiden Network Token', 'RDN', '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6', 'raidenNetworkToken', 18),
    new TokenEntry(Token.TIME_NEW_BANK, 'Time New Bank', 'TNB', '0xf7920b0768ecb20a123fac32311d07d193381d6f', 'timeNewBank', 18),
    new TokenEntry(Token.GENARO_NETWORK, 'Genaro Network', 'GNX', '0x6ec8a24cabdc339a06a172f8223ea557055adaa5', 'genaroNetwork', 9),
    new TokenEntry(Token.CREDITS, 'Credits', 'CS', '0x46b9ad944d1059450da1163511069c718f699d31', 'credits', 6),
    new TokenEntry(Token.WAX, 'WAX', 'WAX', '0x39Bb259F66E1C59d5ABEF88375979b4D20D98022', 'wax', 8),
    new TokenEntry(Token.POET, 'Po.et', 'POE', '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195', 'poet', 8),
    new TokenEntry(Token.BIBOX_TOKEN, 'Bibox Token', 'BIX', '0xb3104b4b9da82025e8b9f8fb28b3553ce2f67069', 'biboxToken', 18),
    new TokenEntry(Token.ARCBLOCK, 'Arcblock', 'ABT', '0xb98d4c97425d9908e66e53a6fdf673acca0be986', 'arcblock', 18),
    new TokenEntry(Token.XPA, 'XPA', 'XPA', '0x90528aeb3a2b736b780fd1b6c478bb7e1d643170', 'xpa', 18),
    new TokenEntry(Token.HIGH_PERFOMANCE_BLOCKCHAIN, 'High Performance Blockchain', 'HPB', '0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2', 'highPerformanceBlockchain', 18),
    new TokenEntry(Token.DEW, 'DEW', 'DEW', '0x20e94867794dba030ee287f1406e100d03c84cd3', 'dew', 18),
    new TokenEntry(Token.PAYPIE, 'PayPie', 'PPP', '0xc42209aCcC14029c1012fB5680D95fBd6036E2a0', 'payPie', 18),
    new TokenEntry(Token.OYSTER, 'Oyster', 'PRL', '0x1844b21593262668b7248d0f57a220caaba46ab9', 'oyster', 18),
    new TokenEntry(Token.EDGELESS, 'Edgeless', 'EDG', '0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c', 'edgeless', 0),
    new TokenEntry(Token.ENVION, 'Envion', 'EVN', '0xd780ae2bf04cd96e577d3d014762f831d97129d0', 'envion', 18),
    new TokenEntry(Token.FUSION, 'Fusion', 'FSN', '0xd0352a019e9ab9d757776f532377aaebd36fd541', 'fusion', 18),
    new TokenEntry(Token.CUBE, 'Cube', 'AUTO', '0x622dFfCc4e83C64ba959530A5a5580687a57581b', 'cube', 18),
    new TokenEntry(Token.SOPHIATX, 'SophiaTX', 'SPHTX', '0x3833dda0aeb6947b98ce454d89366cba8cc55528', 'sophiaTX', 18),
    new TokenEntry(Token.ADEX, 'AdEx', 'EDX', '0x4470bb87d77b963a013db939be332f927f2b992e', 'adEx', 4),
    new TokenEntry(Token.MEDISHARES, 'MediShares', 'MDS', '0x66186008C1050627F979d464eABb258860563dbE', 'mediShares', 18),
    new TokenEntry(Token.ETHLEND, 'ETHLend', 'LEND', '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03', 'ethLend', 18),
    new TokenEntry(Token.OST, 'OST', 'OST', '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca', 'ost', 18),
    new TokenEntry(Token.BLUZELLE, 'Bluzelle', 'BLZ', '0x5732046a883704404f284ce41ffadd5b007fd668', 'bluzelle', 18),
    new TokenEntry(Token.CRYPTO20, 'CRYPTO20', 'C20', '0x26e75307fc0c021472feb8f727839531f112f317', 'crypto20', 18),
    new TokenEntry(Token.IOT_CHAIN, 'IoT Chain', 'ITC', '0x5e6b6d9abad9093fdc861ea1600eba1b355cd940', 'iotChain', 18),
    new TokenEntry(Token.LEADCOIN, 'Leadcoin', 'LDC', '0x5102791ca02fc3595398400bfe0e33d7b6c82267', 'leadcoin', 18),
    new TokenEntry(Token.EIDOO, 'Eidoo', 'EDO', '0xced4e93198734ddaff8492d525bd258d49eb388e', 'eidoo', 18),
    new TokenEntry(Token.BLOCKV, 'BLOCKv', 'VEE', '0x340d2bde5eb28c1eed91b2f790723e3b160613b7', 'blockv', 18),
    new TokenEntry(Token.CYBERMILES, 'CyberMiles', 'CMT', '0xf85feea2fdd81d51177f6b8f35f0e6734ce45f5f', 'cyberMiles', 18),
    new TokenEntry(Token.RIPIO_CREDIT_NETWORK, 'Ripio Credit Network', 'RCN', '0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6', 'ripioCreditNetwork', 18),
    new TokenEntry(Token.TELCOIN, 'Telcoin', 'TEL', '0x85e076361cc813a908ff672f9bad1541474402b2', 'telcoin', 2),
    new TokenEntry(Token.VIBE, 'VIBE', 'VIBE', '0xe8ff5c9c75deb346acac493c463c8950be03dfba', 'vibe', 18),
    new TokenEntry(Token.SONM, 'SONM', 'SNM', '0x983f6d60db79ea8ca4eb9968c6aff8cfa04b3c63', 'sonm', 18),
    new TokenEntry(Token.LOOM_NETWORK, 'Loom Network', 'LOOM', '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0', 'loomNetwork', 18),
    new TokenEntry(Token.TAAS, 'TaaS', 'TAAS', '0xe7775a6e9bcf904eb39da2b68c5efb4f9360e08c', 'taas', 6),
    new TokenEntry(Token.WINGS, 'Wings', 'WINGS', '0x667088b212ce3d06a1b553a7221E1fD19000d9aF', 'wings', 18),
    new TokenEntry(Token.CONSENSUS, 'Consensus', 'SEN', '0xd53370acf66044910bb49cbcfe8f3cd020337f60', 'сonsensus', 18)
  ]);

  private _seed: Buffer = null;
  private keyChain: any = null;

  public sessionId: string = null;
  public paillierPublicKey: any = null;
  public paillierSecretKey: any = null;

  getSeed() {
    return Buffer.from(this._seed);
  }

  setSeed(seed) {
    this._seed = Buffer.from(seed);
    this.keyChain = this._seed ? KeyChain.fromSeed(Buffer.from(seed)) : null;
  }

  reset() {
    if (this._seed) {
      this._seed.fill(0);
    }

    this._seed = null;
    this.keyChain = null;
    this.sessionId = null;
    this.paillierPublicKey = null;
    this.paillierSecretKey = null;
  }

  getCoinSecret(coin: Coin, account: number) {
    return this.keyChain ? this.keyChain.getAccountSecret(coin, account) : null;
  }

  addCustomToken(token: TokenEntry) {
    this.topTokens.next([token].concat(this.topTokens.getValue()));
  }

  // new api

  get seed(): Buffer {
    return Buffer.from(this._seed);
  }

  set seed(seed: Buffer) {
    this._seed = Buffer.from(seed);
    this.keyChain = this._seed ? KeyChain.fromSeed(Buffer.from(seed)) : null;
  }

  privateBytes(coin: number, account: number) {
    return this.keyChain ? this.keyChain.getAccountSecret(coin, account) : null;
  }
}
