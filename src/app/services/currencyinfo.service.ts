import { Injectable } from '@angular/core';
import {
  Curve,
  BitcoinTransaction,
  LitecoinTransaction,
  BitcoinCashTransaction,
  EthereumTransaction,
  NeoTransaction,
  BitcoinWallet,
  LitecoinWallet,
  BitcoinCashWallet,
  EthereumWallet,
  ERC20Wallet,
  NeoWallet
} from 'crypto-core-async';

export enum CurrencyId {
  Bitcoin,
  BitcoinTest,
  Litecoin,
  LitecoinTest,
  BitcoinCash,
  BitcoinCashTest,
  Ethereum,
  EthereumTest,
  Neo,
  NeoTest
}

export enum Cryptosystem {
  Ecdsa,
  Eddsa
}

export class CurrencyInfo {
  public constructor(
    private _id: CurrencyId,
    private _derivationNumber: number,
    private _name: string,
    private _ticker: string,
    private _cryptosystem: Cryptosystem,
    private _curve: any,
    private _network: any,
    private _transactionType: any,
    private _walletType: any,
    private _tokenWalletType: any = null,
    private _tokens: Array<TokenInfo> = []
  ) {}

  public get id(): CurrencyId {
    return this._id;
  }

  public get derivationNumber(): number {
    return this._derivationNumber;
  }

  public get name(): string {
    return this._name;
  }

  public get ticker(): string {
    return this._ticker;
  }

  public get cryptosystem(): Cryptosystem {
    return this._cryptosystem;
  }

  public get curve(): any {
    return this._curve;
  }

  public get network(): any {
    return this._network;
  }

  public get transactionType(): any {
    return this._transactionType;
  }

  public get walletType(): any {
    return this._walletType;
  }

  public get tokenWalletType(): any {
    return this._tokenWalletType;
  }

  public get tokens(): Array<TokenInfo> {
    return this._tokens;
  }
}

export class TokenInfo {
  public constructor(
    private readonly _name: string,
    private readonly _ticker: string,
    private readonly _id: string,
    private readonly _decimals: number
  ) {}

  public get name(): string {
    return this._name;
  }

  public get ticker(): string {
    return this._ticker;
  }

  public get id(): string {
    return this._id;
  }

  public get decimals(): number {
    return this._decimals;
  }
}

@Injectable()
export class CurrencyInfoService {
  private _currencies = new Map<CurrencyId, CurrencyInfo>([
    [CurrencyId.Bitcoin, new CurrencyInfo(
      CurrencyId.Bitcoin,
      0,
      'Bitcoin',
      'BTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      BitcoinWallet.Mainnet,
      BitcoinTransaction,
      BitcoinWallet
    )],
    [CurrencyId.BitcoinTest, new CurrencyInfo(
      CurrencyId.BitcoinTest,
      1,
      'Bitcoin Test',
      'BTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      BitcoinWallet.Testnet,
      BitcoinTransaction,
      BitcoinWallet
    )],
    [CurrencyId.Litecoin, new CurrencyInfo(
      CurrencyId.Litecoin,
      2,
      'Litecoin',
      'LTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      LitecoinWallet.Mainnet,
      LitecoinTransaction,
      LitecoinWallet
    )],
    [CurrencyId.LitecoinTest, new CurrencyInfo(
      CurrencyId.LitecoinTest,
      1,
      'Litecoin Test',
      'LTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      LitecoinWallet.Testnet,
      LitecoinTransaction,
      LitecoinWallet
    )],
    [CurrencyId.BitcoinCash, new CurrencyInfo(
      CurrencyId.BitcoinCash,
      145,
      'Bitcoin Cash',
      'BCH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      BitcoinCashWallet.Mainnet,
      BitcoinCashTransaction,
      BitcoinCashWallet
    )],
    [CurrencyId.BitcoinCashTest, new CurrencyInfo(
      CurrencyId.BitcoinCashTest,
      1,
      'Bitcoin Cash Test',
      'BCH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      BitcoinCashWallet.Testnet,
      BitcoinCashTransaction,
      BitcoinCashWallet
    )],
    [CurrencyId.Ethereum, new CurrencyInfo(
      CurrencyId.Ethereum,
      60,
      'Ethereum',
      'ETH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      EthereumWallet.Mainnet,
      EthereumTransaction,
      EthereumWallet,
      ERC20Wallet, [
        new TokenInfo('TRON', 'TRX', '0xf230b790e05390fc8295f4d3f60332c93bed42e2', 6),
        new TokenInfo('VeChain', 'VEN', '0xd850942ef8811f2a866692a623011bde52a462c1', 18),
        new TokenInfo('ICON', 'ICX', '0xb5a5f22694352c15b00323844ad545abb2b11028', 18),
        new TokenInfo('OmiseGO', 'OMG', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', 18),
        new TokenInfo('Binance Coin', 'BN', '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 18),
        new TokenInfo('DigixDAO', 'DGD', '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a', 9),
        new TokenInfo('Populous', 'PPT', '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a', 8),
        new TokenInfo('RChain', 'RHOC', '0x168296bb09e24a88805cb9c33356536b980d3fc5', 8),
        new TokenInfo('Maker', 'MKR', '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', 18),
        new TokenInfo('Aeternity', 'AE', '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d', 18),
        new TokenInfo('Augur', 'REP', '0xe94327d07fc17907b4db788e5adf2ed424addff6', 18),
        new TokenInfo('Status', 'SNT', '0x744d70fdbe2ba4cf95131626614a1763df805b9e', 18),
        new TokenInfo('Bytom', 'BTM', '0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750', 8),
        new TokenInfo('Aion', 'AION', '0x4CEdA7906a5Ed2179785Cd3A40A69ee8bc99C466', 8),
        new TokenInfo('Waltonchain', 'WTC', '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74', 18),
        new TokenInfo('0x', 'ZRX', '0xe41d2489571d322189246dafa5ebde1f4699f498', 3),
        new TokenInfo('Zilliqa', 'ZIL', '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27', 12),
        new TokenInfo('KuCoin Shares', 'KCS', '0x039b5649a59967e3e936d7471f9c3700100ee1ab', 6),
        new TokenInfo('Veritaseum', 'VERI', '0x8f3470A7388c05eE4e7AF3d01D8C722b0FF52374', 18),
        new TokenInfo('QASH', 'QASH', '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6', 6),
        new TokenInfo('Loopring', 'LRC', '0xEF68e7C694F40c8202821eDF525dE3782458639f', 18),
        new TokenInfo('Ethos', 'ETHOS', '0x5af2be193a6abca9c8817001f45744777db30756', 8),
        new TokenInfo('Golem', 'GNT', '0xa74476443119A942dE498590Fe1f2454d7D4aC0d', 18),
        new TokenInfo('Nebulas', 'NAS', '0x5d65d971895edc438f465c17db6992698a52318d', 18),
        new TokenInfo('Dragonchain', 'DRGN', '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e', 18),
        new TokenInfo('Basic Attention Token', 'BAT', '0x0d8775f648430679a709e98d2b0cb6250d2887ef', 18),
        new TokenInfo('Revain', 'R', '0x48f775efbe4f5ece6e0df2f7b5932df56823b990', 0),
        new TokenInfo('FunFair', 'FUN', '0x419d0d8bdd9af5e606ae2232ed285aff190e711b', 8),
        new TokenInfo('Kyber Network', 'KNC', '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', 18),
        new TokenInfo('IOStoken', 'IOST', '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab', 18),
        new TokenInfo('aelf', 'ELF', '0xbf2179859fc6D5BEE9Bf9158632Dc51678a4100e', 18),
        new TokenInfo('Request Network', 'REQ', '0x8f8221afbb33998d8584a2b05749ba73c37a938a', 18),
        new TokenInfo('SALT', 'SALT', '0x4156D3342D5c385a87D264F90653733592000581', 8),
        new TokenInfo('ChainLink', 'LINK', '0x514910771af9ca656af840dff83e8264ecf986ca', 18),
        new TokenInfo('Polymath', 'POLY', '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec', 18),
        new TokenInfo('Power Ledger', 'POWR', '0x595832f8fc6bf59c85c527fec3740a1b7a361269', 6),
        new TokenInfo('Kin', 'KIN', '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5', 18),
        new TokenInfo('Dentacoin', 'DCN', '0x08d32b0da63e2C3bcF8019c9c5d849d7a9d791e6', 0),
        new TokenInfo('Nucleus Vision', 'NCASH', '0x809826cceab68c387726af962713b64cb5cb3cca', 18),
        new TokenInfo('Bancor', 'BNT', '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c', 18),
        new TokenInfo('TenX', 'PAY', '0xB97048628DB6B661D4C2aA833e95Dbe1A905B280', 18),
        new TokenInfo('Enigma', 'ENG', '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4', 8),
        new TokenInfo('Cindicator', 'CND', '0xd4c435f5b09f855c3317c8524cb1f586e42795fa', 18),
        new TokenInfo('Aragon', 'ANT', '0x960b236A07cf122663c4303350609A66A7B288C0', 18),
        new TokenInfo('Storj', 'STORJ', '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac', 8),
        new TokenInfo('Nuls', 'NULS', '0xb91318f35bdb262e9423bc7c7c2a3a93dd93c92c', 18),
        new TokenInfo('Iconomi', 'ICN', '0x888666CA69E0f178DED6D75b5726Cee99A87D698', 18),
        new TokenInfo('Dent', 'DENT', '0x3597bfd533a99c9aa083587b074434e61eb0a258', 8),
        new TokenInfo('Storm', 'STORM', '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433', 18),
        new TokenInfo('Pillar', 'PLR', '0xe3818504c1b32bf1557b16c238b2e01fd3149c17', 18),
        new TokenInfo('Metal', 'MTL', '0xF433089366899D83a9f26A773D59ec7eCF30355e', 8),
        new TokenInfo('Quantstamp', 'QSP', '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d', 18),
        new TokenInfo('Substratum', 'SUB', '0x12480e24eb5bec1a9d4369cab6a80cad3c0a377a', 2),
        new TokenInfo('Gnosis', 'GNO', '0x6810e776880c02933d47db1b9fc05908e5386b96', 18),
        new TokenInfo('SIRIN LABS Token', 'SRN', '0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25', 18),
        new TokenInfo('Decentraland', 'MANA', '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', 18),
        new TokenInfo('Genesis Vision', 'GVT', '0x103c3a209da59d3e7c4a89307e66521e081cfdf0', 18),
        new TokenInfo('Civic', 'CVC', '0x41e5560054824ea6b0732e656e3ad64e20e94e45', 8),
        new TokenInfo('Dynamic Trading Rights', 'DTR', '0xd234bf2410a0009df9c3c63b610c09738f18ccd7', 8),
        new TokenInfo('Enjin Coin', 'ENJ', '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c', 18),
        new TokenInfo('SingularityNET', 'AGI', '0x8eb24319393716668d768dcec29356ae9cffe285', 8),
        new TokenInfo('Theta Token', 'THETA', '0x3883f5e181fccaF8410FA61e12b59BAd963fb645', 18),
        new TokenInfo('Monaco', 'MCO', '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d', 8),
        new TokenInfo('Santiment Network Token', 'SAN', '0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098', 18),
        new TokenInfo('iExec RLC', 'RLC', '0x607F4C5BB672230e8672085532f7e901544a7375', 9),
        new TokenInfo('Raiden Network Token', 'RDN', '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6', 18),
        new TokenInfo('Time New Bank', 'TNB', '0xf7920b0768ecb20a123fac32311d07d193381d6f', 18),
        new TokenInfo('Genaro Network', 'GNX', '0x6ec8a24cabdc339a06a172f8223ea557055adaa5', 9),
        new TokenInfo('Credits', 'CS', '0x46b9ad944d1059450da1163511069c718f699d31', 6),
        new TokenInfo('WAX', 'WAX', '0x39Bb259F66E1C59d5ABEF88375979b4D20D98022', 8),
        new TokenInfo('Po.et', 'POE', '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195', 8),
        new TokenInfo('Bibox Token', 'BIX', '0xb3104b4b9da82025e8b9f8fb28b3553ce2f67069', 18),
        new TokenInfo('Arcblock', 'ABT', '0xb98d4c97425d9908e66e53a6fdf673acca0be986', 18),
        new TokenInfo('XPA', 'XPA', '0x90528aeb3a2b736b780fd1b6c478bb7e1d643170', 18),
        new TokenInfo('High Performance Blockchain', 'HPB', '0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2', 18),
        new TokenInfo('DEW', 'DEW', '0x20e94867794dba030ee287f1406e100d03c84cd3', 18),
        new TokenInfo('PayPie', 'PPP', '0xc42209aCcC14029c1012fB5680D95fBd6036E2a0', 18),
        new TokenInfo('Oyster', 'PRL', '0x1844b21593262668b7248d0f57a220caaba46ab9', 18),
        new TokenInfo('Edgeless', 'EDG', '0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c', 0),
        new TokenInfo('Envion', 'EVN', '0xd780ae2bf04cd96e577d3d014762f831d97129d0', 18),
        new TokenInfo('Fusion', 'FSN', '0xd0352a019e9ab9d757776f532377aaebd36fd541', 18),
        new TokenInfo('Cube', 'AUTO', '0x622dFfCc4e83C64ba959530A5a5580687a57581b', 18),
        new TokenInfo('SophiaTX', 'SPHTX', '0x3833dda0aeb6947b98ce454d89366cba8cc55528', 18),
        new TokenInfo('AdEx', 'EDX', '0x4470bb87d77b963a013db939be332f927f2b992e', 4),
        new TokenInfo('MediShares', 'MDS', '0x66186008C1050627F979d464eABb258860563dbE', 18),
        new TokenInfo('ETHLend', 'LEND', '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03', 18),
        new TokenInfo('OST', 'OST', '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca', 18),
        new TokenInfo('Bluzelle', 'BLZ', '0x5732046a883704404f284ce41ffadd5b007fd668', 18),
        new TokenInfo('CRYPTO20', 'C20', '0x26e75307fc0c021472feb8f727839531f112f317', 18),
        new TokenInfo('IoT Chain', 'ITC', '0x5e6b6d9abad9093fdc861ea1600eba1b355cd940', 18),
        new TokenInfo('Leadcoin', 'LDC', '0x5102791ca02fc3595398400bfe0e33d7b6c82267', 18),
        new TokenInfo('Eidoo', 'EDO', '0xced4e93198734ddaff8492d525bd258d49eb388e', 18),
        new TokenInfo('BLOCKv', 'VEE', '0x340d2bde5eb28c1eed91b2f790723e3b160613b7', 18),
        new TokenInfo('CyberMiles', 'CMT', '0xf85feea2fdd81d51177f6b8f35f0e6734ce45f5f', 18),
        new TokenInfo('Ripio Credit Network', 'RCN', '0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6', 18),
        new TokenInfo('Telcoin', 'TEL', '0x85e076361cc813a908ff672f9bad1541474402b2', 2),
        new TokenInfo('VIBE', 'VIBE', '0xe8ff5c9c75deb346acac493c463c8950be03dfba', 18),
        new TokenInfo('SONM', 'SNM', '0x983f6d60db79ea8ca4eb9968c6aff8cfa04b3c63', 18),
        new TokenInfo('Loom Network', 'LOOM', '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0', 18),
        new TokenInfo('TaaS', 'TAAS', '0xe7775a6e9bcf904eb39da2b68c5efb4f9360e08c', 6),
        new TokenInfo('Wings', 'WINGS', '0x667088b212ce3d06a1b553a7221E1fD19000d9aF', 18),
        new TokenInfo('Consensus', 'SEN', '0xd53370acf66044910bb49cbcfe8f3cd020337f60', 1)
      ]
    )],
    [CurrencyId.EthereumTest, new CurrencyInfo(
      CurrencyId.EthereumTest,
      1,
      'Ethereum Test',
      'ETH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1,
      EthereumWallet.Testnet,
      EthereumTransaction,
      EthereumWallet
    )],
    [CurrencyId.Neo, new CurrencyInfo(
      CurrencyId.Neo,
      888,
      'Neo',
      'NEO',
      Cryptosystem.Ecdsa,
      Curve.p256,
      NeoWallet.Mainnet,
      NeoTransaction,
      NeoWallet
    )],
    [CurrencyId.NeoTest, new CurrencyInfo(
      CurrencyId.NeoTest,
      1,
      'Neo Test',
      'NEO',
      Cryptosystem.Ecdsa,
      Curve.p256,
      NeoWallet.Testnet,
      NeoTransaction,
      NeoWallet
    )]
  ]);

  private _syncOrder = [
    CurrencyId.Bitcoin,
    CurrencyId.Litecoin,
    CurrencyId.BitcoinCash,
    CurrencyId.Ethereum,
    CurrencyId.Neo,
    CurrencyId.BitcoinTest,
    CurrencyId.LitecoinTest,
    CurrencyId.BitcoinCashTest,
    CurrencyId.EthereumTest,
    CurrencyId.NeoTest
  ];

  currencyInfo(id: CurrencyId): CurrencyInfo {
    return this._currencies.get(id);
  }

  get syncOrder(): CurrencyId[] {
    return this._syncOrder;
  }
}

