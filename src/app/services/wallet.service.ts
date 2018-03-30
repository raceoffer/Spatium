import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import { BluetoothService } from './bluetooth.service';
import { Coin, Token, KeyChainService } from './keychain.service';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { toBehaviourSubject } from '../utils/transformers';

import { CurrencyWallet, Status } from './wallet/currencywallet';
import { BitcoinWallet } from './wallet/bitcoin/bitcoinwallet';
import { BitcoinCashWallet } from './wallet/bitcoin/bitcoincashwallet';
import { EthereumCurrencyWallet } from './wallet/ethereum/ethereumwallet';
import { ERC20CurrencyWallet } from './wallet/ethereum/erc20wallet';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const CryptoCore: any;

@Injectable()
export class WalletService {
  private messageSubject: ReplaySubject<any> = new ReplaySubject<any>(1);

  public coinWallets = new Map<Coin, CurrencyWallet>();
  public tokenWallets = new Map<Token, ERC20CurrencyWallet>();

  public currencyWallets = new Map<Coin | Token, CurrencyWallet>();

  public status: Observable<Status>;

  public synchronizing: Observable<boolean>;

  public ready: Observable<boolean>;

  public syncProgress: Observable<number>;

  public statusChanged: Observable<Status>;

  public synchronizingEvent: Observable<any>;
  public cancelledEvent: Observable<any>;
  public failedEvent: Observable<any>;
  public readyEvent: Observable<any>;

  public paillierKeys: any = null;

  public generatedKeys: BehaviorSubject<Status> = new BehaviorSubject<Status>(Status.None);

  constructor(
    private readonly bt: BluetoothService,
    private readonly keychain: KeyChainService,
    private readonly ngZone: NgZone
  ) {
    this.coinWallets.set(
      Coin.BTC_test,
      new BitcoinWallet(
        'testnet',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.coinWallets.set(
      Coin.BTC,
      new BitcoinWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.coinWallets.set(
      Coin.BCH,
      new BitcoinCashWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.coinWallets.set(
      Coin.ETH,
      new EthereumCurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone
      ));
    this.tokenWallets.set(
      Token.EOS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.EOS,
        '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0'
      ));
    this.tokenWallets.set(
      Token.TRON,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.TRON,
        '0xf230b790e05390fc8295f4d3f60332c93bed42e2'
      ));
    this.tokenWallets.set(
      Token.VECHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.VECHAIN,
        '0xd850942ef8811f2a866692a623011bde52a462c1'
      ));
    this.tokenWallets.set(
      Token.ICON,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ICON,
        '0xb5a5f22694352c15b00323844ad545abb2b11028'
      ));
    this.tokenWallets.set(
      Token.OMNISEGO,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.OMNISEGO,
        '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
      ));
    this.tokenWallets.set(
      Token.BINANCECOIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BINANCECOIN,
        '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
      ));
    this.tokenWallets.set(
      Token.DIGIXDAO,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DIGIXDAO,
        '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'
      ));
    this.tokenWallets.set(
      Token.POPULOUS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.POPULOUS,
        '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a'
      ));
    this.tokenWallets.set(
      Token.RCHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.RCHAIN,
        '0x168296bb09e24a88805cb9c33356536b980d3fc5'
      ));
    this.tokenWallets.set(
      Token.MAKER,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.MAKER,
        '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'
      ));
    this.tokenWallets.set(
      Token.AETHERNITY,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.AETHERNITY,
        '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d'
      ));
    this.tokenWallets.set(
      Token.AUGUR,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.AUGUR,
        '0xe94327d07fc17907b4db788e5adf2ed424addff6'
      ));
    this.tokenWallets.set(
      Token.STATUS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.STATUS,
        '0x744d70fdbe2ba4cf95131626614a1763df805b9e'
      ));
    this.tokenWallets.set(
      Token.BYTOM,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BYTOM,
        '0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750'
      ));
    this.tokenWallets.set(
      Token.AION,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.AION,
        '0x4CEdA7906a5Ed2179785Cd3A40A69ee8bc99C466'
      ));
    this.tokenWallets.set(
      Token.WALTONCHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.WALTONCHAIN,
        '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74'
      ));
    this.tokenWallets.set(
      Token.OX,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.OX,
        '0xe41d2489571d322189246dafa5ebde1f4699f498'
      ));
    this.tokenWallets.set(
      Token.ZILLIQA,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ZILLIQA,
        '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27'
      ));
    this.tokenWallets.set(
      Token.KUCOIN_SHARES,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.KUCOIN_SHARES,
        '0x039b5649a59967e3e936d7471f9c3700100ee1ab'
      ));
    this.tokenWallets.set(
      Token.VERITASEUM,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.VERITASEUM,
        '0x8f3470A7388c05eE4e7AF3d01D8C722b0FF52374'
      ));
    this.tokenWallets.set(
      Token.QASH,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.QASH,
        '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6'
      ));
    this.tokenWallets.set(
      Token.LOOPRING,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.LOOPRING,
        '0xEF68e7C694F40c8202821eDF525dE3782458639f'
      ));
    this.tokenWallets.set(
      Token.ETHOS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ETHOS,
        '0x5af2be193a6abca9c8817001f45744777db30756'
      ));
    this.tokenWallets.set(
      Token.GOLEM,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.GOLEM,
        '0xa74476443119A942dE498590Fe1f2454d7D4aC0d'
      ));
    this.tokenWallets.set(
      Token.NEBULAS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.NEBULAS,
        '0x5d65d971895edc438f465c17db6992698a52318d'
      ));
    this.tokenWallets.set(
      Token.DRAGONCHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DRAGONCHAIN,
        '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e'
      ));
    this.tokenWallets.set(
      Token.BASIC_ATTENTION_TOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BASIC_ATTENTION_TOKEN,
        '0x0d8775f648430679a709e98d2b0cb6250d2887ef'
      ));
    this.tokenWallets.set(
      Token.REVAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.REVAIN,
        '0x48f775efbe4f5ece6e0df2f7b5932df56823b990'
      ));
    this.tokenWallets.set(
      Token.FUNFAIR,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.FUNFAIR,
        '0x419d0d8bdd9af5e606ae2232ed285aff190e711b'
      ));
    this.tokenWallets.set(
      Token.KYBER_NETWORK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.KYBER_NETWORK,
        '0xdd974d5c2e2928dea5f71b9825b8b646686bd200'
      ));
    this.tokenWallets.set(
      Token.IOSTOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.IOSTOKEN,
        '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab'
      ));
    this.tokenWallets.set(
      Token.AELF,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.AELF,
        '0xbf2179859fc6D5BEE9Bf9158632Dc51678a4100e'
      ));
    this.tokenWallets.set(
      Token.REQUEST_NETWORK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.REQUEST_NETWORK,
        '0x8f8221afbb33998d8584a2b05749ba73c37a938a'
      ));
    this.tokenWallets.set(
      Token.SALT,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SALT,
        '0x4156D3342D5c385a87D264F90653733592000581'
      ));
    this.tokenWallets.set(
      Token.CHAINLINK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CHAINLINK,
        '0x514910771af9ca656af840dff83e8264ecf986ca'
      ));
    this.tokenWallets.set(
      Token.POLYMATH,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.POLYMATH,
        '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec'
      ));
    this.tokenWallets.set(
      Token.POWER_LEDGER,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.POWER_LEDGER,
        '0x595832f8fc6bf59c85c527fec3740a1b7a361269'
      ));
    this.tokenWallets.set(
      Token.KIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.KIN,
        '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5'
      ));
    this.tokenWallets.set(
      Token.DENTACOIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DENTACOIN,
        '0x08d32b0da63e2C3bcF8019c9c5d849d7a9d791e6'
      ));
    this.tokenWallets.set(
      Token.NUCLEUS_VISION,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.NUCLEUS_VISION,
        '0x809826cceab68c387726af962713b64cb5cb3cca'
      ));
    this.tokenWallets.set(
      Token.BANCOR,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BANCOR,
        '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c'
      ));
    this.tokenWallets.set(
      Token.TENX,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.TENX,
        '0xB97048628DB6B661D4C2aA833e95Dbe1A905B280'
      ));
    this.tokenWallets.set(
      Token.ENIGMA,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ENIGMA,
        '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab'
      ));
    this.tokenWallets.set(
      Token.CINDICATOR,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CINDICATOR,
        '0xd4c435f5b09f855c3317c8524cb1f586e42795fa'
      ));
    this.tokenWallets.set(
      Token.ARAGON,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ARAGON,
        '0x960b236A07cf122663c4303350609A66A7B288C0'
      ));
    this.tokenWallets.set(
      Token.STORJ,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.STORJ,
        '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac'
      ));
    this.tokenWallets.set(
      Token.NULS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.NULS,
        '0xb91318f35bdb262e9423bc7c7c2a3a93dd93c92c'
      ));
    this.tokenWallets.set(
      Token.ICONOMI,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ICONOMI,
        '0x888666CA69E0f178DED6D75b5726Cee99A87D698'
      ));
    this.tokenWallets.set(
      Token.DENT,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DENT,
        '0x3597bfd533a99c9aa083587b074434e61eb0a258'
      ));
    this.tokenWallets.set(
      Token.STORM,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.STORM,
        '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433'
      ));
    this.tokenWallets.set(
      Token.PILLAR,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.PILLAR,
        '0xe3818504c1b32bf1557b16c238b2e01fd3149c17'
      ));
    this.tokenWallets.set(
      Token.METAL,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.METAL,
        '0xF433089366899D83a9f26A773D59ec7eCF30355e'
      ));
    this.tokenWallets.set(
      Token.QUANTSTAMP,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.QUANTSTAMP,
        '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d'
      ));
    this.tokenWallets.set(
      Token.SUBSTRATUM,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SUBSTRATUM,
        '0x12480e24eb5bec1a9d4369cab6a80cad3c0a377a'
      ));
    this.tokenWallets.set(
      Token.GNOSIS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.GNOSIS,
        '0x6810e776880c02933d47db1b9fc05908e5386b96'
      ));
    this.tokenWallets.set(
      Token.SIRIN_LABS_TOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SIRIN_LABS_TOKEN,
        '0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25'
      ));
    this.tokenWallets.set(
      Token.DECENTRALAND,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DECENTRALAND,
        '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
      ));
    this.tokenWallets.set(
      Token.GENESIS_VISION,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.GENESIS_VISION,
        '0x103c3a209da59d3e7c4a89307e66521e081cfdf0'
      ));
    this.tokenWallets.set(
      Token.CIVIC,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CIVIC,
        '0x41e5560054824ea6b0732e656e3ad64e20e94e45'
      ));
    this.tokenWallets.set(
      Token.DYNAMIC_TRADING_RIGHTS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DYNAMIC_TRADING_RIGHTS,
        '0xd234bf2410a0009df9c3c63b610c09738f18ccd7'
      ));
    this.tokenWallets.set(
      Token.ENJIN_COIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ENJIN_COIN,
        '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c'
      ));
    this.tokenWallets.set(
      Token.SINGULARITYNET,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SINGULARITYNET,
        '0x8eb24319393716668d768dcec29356ae9cffe285'
      ));
    this.tokenWallets.set(
      Token.THETA_TOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.THETA_TOKEN,
        '0x3883f5e181fccaF8410FA61e12b59BAd963fb645'
      ));
    this.tokenWallets.set(
      Token.MONACO,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.MONACO,
        '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d'
      ));
    this.tokenWallets.set(
      Token.SANTIMENT_NETWORK_TOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SANTIMENT_NETWORK_TOKEN,
        '0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098'
      ));
    this.tokenWallets.set(
      Token.IEXEC_RLC,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.IEXEC_RLC,
        '0x607F4C5BB672230e8672085532f7e901544a7375'
      ));
    this.tokenWallets.set(
      Token.RAIDEN_NETWORK_TOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.RAIDEN_NETWORK_TOKEN,
        '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6'
      ));
    this.tokenWallets.set(
      Token.TIME_NEW_BANK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.TIME_NEW_BANK,
        '0xf7920b0768ecb20a123fac32311d07d193381d6f'
      ));
    this.tokenWallets.set(
      Token.GENARO_NETWORK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.GENARO_NETWORK,
        '0x6ec8a24cabdc339a06a172f8223ea557055adaa5'
      ));
    this.tokenWallets.set(
      Token.CREDITS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CREDITS,
        '0x46b9ad944d1059450da1163511069c718f699d31'
      ));
    this.tokenWallets.set(
      Token.WAX,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.WAX,
        '0x39Bb259F66E1C59d5ABEF88375979b4D20D98022'
      ));
    this.tokenWallets.set(
      Token.POET,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.POET,
        '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195'
      ));
    this.tokenWallets.set(
      Token.BIBOX_TOKEN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BIBOX_TOKEN,
        '0xb3104b4b9da82025e8b9f8fb28b3553ce2f67069'
      ));
    this.tokenWallets.set(
      Token.ARCBLOCK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ARCBLOCK,
        '0xb98d4c97425d9908e66e53a6fdf673acca0be986'
      ));
    this.tokenWallets.set(
      Token.XPA,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.XPA,
        '0x90528aeb3a2b736b780fd1b6c478bb7e1d643170'
      ));
    this.tokenWallets.set(
      Token.HIGH_PERFOMANCE_BLOCKCHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.HIGH_PERFOMANCE_BLOCKCHAIN,
        '0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2'
      ));
    this.tokenWallets.set(
      Token.DEW,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.DEW,
        '0x20e94867794dba030ee287f1406e100d03c84cd3'
      ));
    this.tokenWallets.set(
      Token.PAYPIE,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.PAYPIE,
        '0xc42209aCcC14029c1012fB5680D95fBd6036E2a0'
      ));
    this.tokenWallets.set(
      Token.OYSTER,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.OYSTER,
        '0x1844b21593262668b7248d0f57a220caaba46ab9'
      ));
    this.tokenWallets.set(
      Token.EDGELESS,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.EDGELESS,
        '0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c'
      ));
    this.tokenWallets.set(
      Token.ENVION,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ENVION,
        '0xd780ae2bf04cd96e577d3d014762f831d97129d0'
      ));
    this.tokenWallets.set(
      Token.FUSION,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.FUSION,
        '0xd0352a019e9ab9d757776f532377aaebd36fd541'
      ));
    this.tokenWallets.set(
      Token.CUBE,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CUBE,
        '0x622dFfCc4e83C64ba959530A5a5580687a57581b'
      ));
    this.tokenWallets.set(
      Token.SOPHIATX,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SOPHIATX,
        '0x3833dda0aeb6947b98ce454d89366cba8cc55528'
      ));
    this.tokenWallets.set(
      Token.ADEX,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ADEX,
        '0x4470bb87d77b963a013db939be332f927f2b992e'
      ));
    this.tokenWallets.set(
      Token.MEDISHARES,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.MEDISHARES,
        '0x66186008C1050627F979d464eABb258860563dbE'
      ));
    this.tokenWallets.set(
      Token.ETHLEND,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.ETHLEND,
        '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03'
      ));
    this.tokenWallets.set(
      Token.OST,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.OST,
        '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca'
      ));
    this.tokenWallets.set(
      Token.BLUZELLE,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BLUZELLE,
        '0x5732046a883704404f284ce41ffadd5b007fd668'
      ));
    this.tokenWallets.set(
      Token.CRYPTO20,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CRYPTO20,
        '0x26e75307fc0c021472feb8f727839531f112f317'
      ));
    this.tokenWallets.set(
      Token.IOT_CHAIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.IOT_CHAIN,
        '0x5e6b6d9abad9093fdc861ea1600eba1b355cd940'
      ));
    this.tokenWallets.set(
      Token.LEADCOIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.LEADCOIN,
        '0x5102791ca02fc3595398400bfe0e33d7b6c82267'
      ));
    this.tokenWallets.set(
      Token.EIDOO,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.EIDOO,
        '0xced4e93198734ddaff8492d525bd258d49eb388e'
      ));
    this.tokenWallets.set(
      Token.BLOCKV,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.BLOCKV,
        '0x340d2bde5eb28c1eed91b2f790723e3b160613b7'
      ));
    this.tokenWallets.set(
      Token.CYBERMILES,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.CYBERMILES,
        '0xf85feea2fdd81d51177f6b8f35f0e6734ce45f5f'
      ));
    this.tokenWallets.set(
      Token.RIPIO_CREDIT_NETWORK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.RIPIO_CREDIT_NETWORK,
        '0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6'
      ));
    this.tokenWallets.set(
      Token.TELCOIN,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.TELCOIN,
        '0x85e076361cc813a908ff672f9bad1541474402b2'
      ));
    this.tokenWallets.set(
      Token.VIBE,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.VIBE,
        '0xe8ff5c9c75deb346acac493c463c8950be03dfba'
      ));
    this.tokenWallets.set(
      Token.SONM,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.SONM,
        '0x983f6d60db79ea8ca4eb9968c6aff8cfa04b3c63'
      ));
    this.tokenWallets.set(
      Token.LOOM_NETWORK,
      new ERC20CurrencyWallet(
        'main',
        this.keychain,
        1,
        this.messageSubject,
        this.bt,
        this.ngZone,
        Token.LOOM_NETWORK,
        '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0'
      ));

    for (const coin of Array.from(this.coinWallets.keys())) {
      this.currencyWallets.set(coin, this.coinWallets.get(coin));
    }
    for (const token of Array.from(this.tokenWallets.keys())) {
      this.currencyWallets.set(token, this.tokenWallets.get(token));
    }

    this.status = toBehaviourSubject(combineLatest(
      Array.from(this.coinWallets.values())
        .concat(Array.from(this.tokenWallets.values()))
        .map(wallet => wallet.status)
        .concat(this.generatedKeys),
      (... values) => {
        if (values.every(value => value === Status.Ready)) {
          return Status.Ready;
        }
        if (values.some(value => value === Status.Failed)) {
          return Status.Failed;
        }
        if (values.some(value => value === Status.Cancelled)) {
          return Status.Cancelled;
        }
        if (values.every(value => value === Status.None)) {
          return Status.None;
        }
        return Status.Synchronizing;
      }
    ), Status.None);

    this.synchronizing = toBehaviourSubject(this.status.map(status => status === Status.Synchronizing), false);
    this.ready = toBehaviourSubject(this.status.map(status => status === Status.Ready), false);

    this.syncProgress = toBehaviourSubject(combineLatest(
      toBehaviourSubject(combineLatest(
        Array.from(this.coinWallets.values()).map(wallet => wallet.syncProgress),
        (... values) => {
          return values.reduce((a, b) => a + b, 0);
        }
      ), 0),
      toBehaviourSubject(combineLatest(
        Array.from(this.tokenWallets.values()).map(wallet => wallet.ready),
        (... values) => {
          return values.map(ready => ready ? 25 : 0).reduce((a, b) => a + b, 0);
        }
      ), 0),
      toBehaviourSubject(this.generatedKeys.map(keys => keys === Status.Ready ? 100 : 20), 0),
      (a, b, c) => {
        return (a + b + c) / (this.coinWallets.size + this.tokenWallets.size / 4 + 1);
      }), 0);

    this.statusChanged = this.status.skip(1).distinctUntilChanged();

    this.synchronizingEvent = this.statusChanged.filter(status => status === Status.Synchronizing).mapTo(null);
    this.cancelledEvent = this.statusChanged.filter(status => status === Status.Cancelled).mapTo(null);
    this.failedEvent = this.statusChanged.filter(status => status === Status.Failed).mapTo(null);
    this.readyEvent = this.statusChanged.filter(status => status === Status.Ready).mapTo(null);

    this.bt.message.subscribe((message) => {
      this.messageSubject.next(JSON.parse(message));
    });

    this.messageSubject
      .filter(object => object.type === 'verifyTransaction')
      .map(object => object.content)
      .subscribe(async content => {
        const wallet = this.currencyWallets.get(content.coin);
        return await wallet.startTransactionVerify(wallet.fromJSON(content.tx));
      });
  }

  public async reset() {
    this.generatedKeys.next(Status.None);
    for (const wallet of Array.from(this.currencyWallets.values())) {
      await wallet.reset();
    }
  }

  public async startSync() {
    this.generatedKeys.next(Status.Synchronizing);

    this.paillierKeys = await CryptoCore.CompoundKey.generatePaillierKeys();

    this.generatedKeys.next(Status.Ready);

    for (const wallet of Array.from(this.coinWallets.values())) {
      const syncEvent = wallet.readyEvent.take(1).takeUntil(combineLatest(this.cancelledEvent, this.failedEvent)).toPromise();

      await wallet.sync(this.paillierKeys);

      await syncEvent;
    }

    const ethWallet = this.coinWallets.get(Coin.ETH);

    for (const wallet of Array.from(this.tokenWallets.values())) {
      await wallet.syncDuplicate(ethWallet);
    }
  }

  public async cancelSync() {
    for (const wallet of Array.from(this.coinWallets.values())) {
      await wallet.cancelSync();
    }
  }
}

