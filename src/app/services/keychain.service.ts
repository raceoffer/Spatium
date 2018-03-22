import { Injectable } from '@angular/core';

declare const KeyChain: any;

export enum Coin {
  BTC = 0,
  BTC_test = 1,
  ETH = 60,
  BCH = 145
}

export enum Token {
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
  PUNDI_X = 56242,
  VIBE = 56243,
  SONM = 56244,
  LOOM_NETWORK = 56245
}

@Injectable()
export class KeyChainService {
  private _seed: any = null;
  private keyChain: any = null;

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
      this._seed = null;
      this.keyChain = null;
    }
  }

  getCoinSecret(coin: Coin, account: number) {
    return this.keyChain ? this.keyChain.getAccountSecret(coin, account) : null;
  }

  constructor() { }
}
