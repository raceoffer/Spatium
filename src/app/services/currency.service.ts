import { Injectable } from '@angular/core';
import { Coin, Token } from './keychain.service';
import { CurrencyPriceService } from './price.service';
import * as bsHelper from '../utils/transformers';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class Info {
  name: string;
  symbol: string;
  gasPrice: number;
  gasPriceLow: number;
  gasUnit: string;
  rate: BehaviorSubject<number>;
  gasRate: BehaviorSubject<number>;
  icon: string = null;

  constructor(
    name: string,
    symbol: string,
    gasPrice: number,
    gasPriceLow: number,
    gasUnit: string,
    rate: BehaviorSubject<number>,
    gasRate?: BehaviorSubject<number>,
    icon?: string
  ) {
    this.name = name;
    this.symbol = symbol;
    this.gasPrice = gasPrice;
    this.gasPriceLow = gasPriceLow;
    this.gasUnit = gasUnit;
    this.rate = rate;
    this.gasRate = gasRate || rate;
    this.icon = icon || null;
  }
}

@Injectable()
export class CurrencyService {
  private readonly staticInfo = new Map<Coin | Token, Info>([
    [ Coin.BTC, new Info(
      'Bitcoin',
      'BTC',
      0.001,
      0.0002,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTC') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Coin.BTC_test, new Info(
      'Bitcoin Test',
      'BTC',
      0.001,
      0.0002,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTC') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Coin.BCH, new Info(
      'Bitcoin Cash',
      'BCH',
      0.001,
      0.0002,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BCH') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Coin.ETH, new Info(
      'Ethereum',
      'ETH',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Token.EOS, new Info(
      'EOS',
      'EOS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('EOS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'eos'
    ) ],
    [ Token.TRON, new Info(
      'TRON',
      'TRX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('TRX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'tron'
    ) ],
    [ Token.VECHAIN, new Info(
      'VeChain',
      'VEN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('VEN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'veChain'
    ) ],
    [ Token.ICON, new Info(
      'ICON',
      'ICX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ICX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'icon'
    ) ],
    [ Token.OMNISEGO, new Info(
      'OmiseGO',
      'OMG',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('OMG') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'omiseGO'
    ) ],
    [ Token.BINANCECOIN, new Info(
      'Binance Coin',
      'BNB',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BNB') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'binanceCoin'
    ) ],
    [ Token.DIGIXDAO, new Info(
      'DigixDAO',
      'DGD',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('DGD') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'digixDAO'
    ) ],
    [ Token.POPULOUS, new Info(
      'Populous',
      'PPT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('PPT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'populous'
    ) ],
    [ Token.RCHAIN, new Info(
      'RChain',
      'RHOC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('RHOC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'rchain'
    ) ],
    [ Token.MAKER, new Info(
      'Maker',
      'MKR',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('MKR') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'maker'
    ) ],
    [ Token.AETHERNITY, new Info(
      'Aeternity',
      'AE',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('AE') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'aeternity'
    ) ],
    [ Token.AUGUR, new Info(
      'Augur',
      'REP',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('REP') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'augur'
    ) ],
    [ Token.STATUS, new Info(
      'Status',
      'SNT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SNT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'status'
    ) ],
    [ Token.BYTOM, new Info(
      'Bytom',
      'BTM',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTM') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'bytom'
    ) ],
    [ Token.AION, new Info(
      'Aion',
      'AION',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('AION') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'aion'
    ) ],
    [ Token.WALTONCHAIN, new Info(
      'Waltonchain',
      'WTC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('WTC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'waltonchain'
    ) ],
    [ Token.OX, new Info(
      '0x',
      'ZRX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ZRX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      '0x'
    ) ],
    [ Token.ZILLIQA, new Info(
      'Zilliqa',
      'ZIL',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ZIL') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'zilliqa'
    ) ],
    [ Token.KUCOIN_SHARES, new Info(
      'KuCoin Shares',
      'KCS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('KCS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'kuCoinShares'
    ) ],
    [ Token.VERITASEUM, new Info(
      'Veritaseum',
      'VERI',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('VERI') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'veritaseum'
    ) ],
    [ Token.QASH, new Info(
      'QASH',
      'QASH',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('QASH') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'qash'
    ) ],
    [ Token.LOOPRING, new Info(
      'Loopring',
      'LRC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('LRC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'loopring'
    ) ],
    [ Token.ETHOS, new Info(
      'Ethos',
      'ETHOS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETHOS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'ethos'
    ) ],
    [ Token.GOLEM, new Info(
      'Golem',
      'GNT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('GNT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'golem'
    ) ],
    [ Token.NEBULAS, new Info(
      'Nebulas',
      'NAS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('NAS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'nebulas'
    ) ],
    [ Token.DRAGONCHAIN, new Info(
      'Dragonchain',
      'DRGN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('DRGN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'dragonchain'
    ) ],
    [ Token.BASIC_ATTENTION_TOKEN, new Info(
      'Basic Attention Token',
      'BAT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BAT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'basicAttentionToken'
    ) ],
    [ Token.REVAIN, new Info(
      'Revain',
      'R',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('R') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'revain'
    ) ],
    [ Token.FUNFAIR, new Info(
      'FunFair',
      'FUN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('FUN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'funFair'
    ) ],
    [ Token.KYBER_NETWORK, new Info(
      'Kyber Network',
      'KNC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('KNC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'kyberNetwork'
    ) ],
    [ Token.IOSTOKEN, new Info(
      'IOStoken',
      'IOST',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('IOST') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'iostoken'
    ) ],
    [ Token.AELF, new Info(
      'aelf',
      'ELF',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ELF') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'aelf'
    ) ],
    [ Token.REQUEST_NETWORK, new Info(
      'Request Network',
      'REQ',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('REQ') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'requestNetwork'
    ) ],
    [ Token.SALT, new Info(
      'SALT',
      'SALT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SALT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'salt'
    ) ],
    [ Token.CHAINLINK, new Info(
      'ChainLink',
      'LINK',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('LINK') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'chainLink'
    ) ],
    [ Token.POLYMATH, new Info(
      'Polymath',
      'POLY',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('POLY') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'polymath'
    ) ],
    [ Token.POWER_LEDGER, new Info(
      'Power Ledger',
      'POWR',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('POWR') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'powerLedger'
    ) ],
    [ Token.KIN, new Info(
      'Kin',
      'KIN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('KIN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'kin'
    ) ],
    [ Token.DENTACOIN, new Info(
      'Dentacoin',
      'DCN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('DCN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'dentacoin'
    ) ],
    [ Token.NUCLEUS_VISION, new Info(
      'Nucleus Vision',
      'NCASH',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('NCASH') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'nucleusVision'
    ) ],
    [ Token.BANCOR, new Info(
      'Bancor',
      'BNT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BNT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'bancor'
    ) ],
    [ Token.TENX, new Info(
      'TenX',
      'PAY',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('PAY') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'tenx'
    ) ],
    [ Token.ENIGMA, new Info(
      'Enigma',
      'ENG',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ENG') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'enigma'
    ) ],
    [ Token.CINDICATOR, new Info(
      'Cindicator',
      'CND',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('CND') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'cindicator'
    ) ],
    [ Token.ARAGON, new Info(
      'Aragon',
      'ANT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ANT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'aragon'
    ) ],
    [ Token.STORJ, new Info(
      'Storj',
      'STORJ',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('STORJ') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'storj'
    ) ],
    [ Token.NULS, new Info(
      'Nuls',
      'NULS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('NULS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'nuls'
    ) ],
    [ Token.ICONOMI, new Info(
      'Iconomi',
      'ICN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ICN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'iconomi'
    ) ],
    [ Token.DENT, new Info(
      'Dent',
      'DENT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('DENT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'dent'
    ) ],
    [ Token.STORM, new Info(
      'Storm',
      'STORM',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('STORM') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'storm'
    ) ],
    [ Token.PILLAR, new Info(
      'Pillar',
      'PLR',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('PLR') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'pillar'
    ) ],
    [ Token.METAL, new Info(
      'Metal',
      'MTL',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('MTL') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'metal'
    ) ],
    [ Token.QUANTSTAMP, new Info(
      'Quantstamp',
      'QSP',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('QSP') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'quantstamp'
    ) ],
    [ Token.SUBSTRATUM, new Info(
      'Substratum',
      'SUB',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SUB') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'substratum'
    ) ],
    [ Token.GNOSIS, new Info(
      'Gnosis',
      'GNO',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('GNO') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'gnosis'
    ) ],
    [ Token.SIRIN_LABS_TOKEN, new Info(
      'SIRIN LABS Token',
      'SRN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SRN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'sirinLabsToken'
    ) ],
    [ Token.DECENTRALAND, new Info(
      'Decentraland',
      'MANA',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('MANA') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'decentraland'
    ) ],
    [ Token.GENESIS_VISION, new Info(
      'Genesis Vision',
      'GVT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('GVT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'genesisVision'
    ) ],
    [ Token.CIVIC, new Info(
      'Civic',
      'CVC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('CVC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'civic'
    ) ],
    [ Token.DYNAMIC_TRADING_RIGHTS, new Info(
      'Dynamic Trading Rights',
      'DTR',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('DTR') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'dynamicTradingRights'
    ) ],
    [ Token.ENJIN_COIN, new Info(
      'Enjin Coin',
      'ENJ',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ENJ') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'enjinCoin'
    ) ],
    [ Token.SINGULARITYNET, new Info(
      'SingularityNET',
      'AGI',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('AGI') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'singularityNET'
    ) ],
    [ Token.THETA_TOKEN, new Info(
      'Theta Token',
      'THETA',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('THETA') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'thetaToken'
    ) ],
    [ Token.MONACO, new Info(
      'Monaco',
      'MCO',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('MCO') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'monaco'
    ) ],
    [ Token.SANTIMENT_NETWORK_TOKEN, new Info(
      'Santiment Network Token',
      'SAN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SAN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'santimentNetworkToken'
    ) ],
    [ Token.IEXEC_RLC, new Info(
      'iExec RLC',
      'RLC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('RLC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'iExecRLC'
    ) ],
    [ Token.RAIDEN_NETWORK_TOKEN, new Info(
      'Raiden Network Token',
      'RDN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('RDN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'raidenNetworkToken'
    ) ],
    [ Token.TIME_NEW_BANK, new Info(
      'Time New Bank',
      'TNB',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('TNB') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'timeNewBank'
    ) ],
    [ Token.GENARO_NETWORK, new Info(
      'Genaro Network',
      'GNX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('GNX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'genaroNetwork'
    ) ],
    [ Token.CREDITS, new Info(
      'Credits',
      'CS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('CS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'credits'
    ) ],
    [ Token.WAX, new Info(
      'WAX',
      'WAX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('WAX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'wax'
    ) ],
    [ Token.POET, new Info(
      'Po.et',
      'POE',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('POE') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'poet'
    ) ],
    [ Token.BIBOX_TOKEN, new Info(
      'Bibox Token',
      'BIX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BIX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'biboxToken'
    ) ],
    [ Token.ARCBLOCK, new Info(
      'Arcblock',
      'ABT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ABT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'arcblock'
    ) ],
    [ Token.XPA, new Info(
      'XPA',
      'XPA',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('XPA') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'xpa'
    ) ],
    [ Token.HIGH_PERFOMANCE_BLOCKCHAIN, new Info(
      'High Performance Blockchain',
      'HPB',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('HPB') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'highPerformanceBlockchain'
    ) ],
    [ Token.DEW, new Info(
      'DEW',
      'DEW',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('DEW') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'dew'
    ) ],
    [ Token.PAYPIE, new Info(
      'PayPie',
      'PPP',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('PPP') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'payPie'
    ) ],
    [ Token.OYSTER, new Info(
      'Oyster',
      'PRL',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('PRL') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'oyster'
    ) ],
    [ Token.EDGELESS, new Info(
      'Edgeless',
      'EDG',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('EDG') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'edgeless'
    ) ],
    [ Token.ENVION, new Info(
      'Envion',
      'EVN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('EVN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'envion'
    ) ],
    [ Token.FUSION, new Info(
      'Fusion',
      'FSN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('FSN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'fusion'
    ) ],
    [ Token.CUBE, new Info(
      'Cube',
      'AUTO',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('AUTO') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'cube'
    ) ],
    [ Token.SOPHIATX, new Info(
      'SophiaTX',
      'SPHTX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SPHTX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'sophiaTX'
    ) ],
    [ Token.ADEX, new Info(
      'AdEx',
      'ADX',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ADX') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'adEx'
    ) ],
    [ Token.MEDISHARES, new Info(
      'MediShares',
      'MDS',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('MDS') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'mediShares'
    ) ],
    [ Token.ETHLEND, new Info(
      'ETHLend',
      'LEND',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('LEND') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'ethLend'
    ) ],
    [ Token.OST, new Info(
      'OST',
      'OST',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('OST') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'ost'
    ) ],
    [ Token.BLUZELLE, new Info(
      'Bluzelle',
      'BLZ',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BLZ') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'bluzelle'
    ) ],
    [ Token.CRYPTO20, new Info(
      'CRYPTO20',
      'C20',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('C20') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'crypto20'
    ) ],
    [ Token.IOT_CHAIN, new Info(
      'IoT Chain',
      'ITC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ITC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'iotChain'
    ) ],
    [ Token.LEADCOIN, new Info(
      'Leadcoin',
      'LDC',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('LDC') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'leadcoin'
    ) ],
    [ Token.EIDOO, new Info(
      'Eidoo',
      'EDO',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('EDO') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'eidoo'
    ) ],
    [ Token.BLOCKV, new Info(
      'BLOCKv',
      'VEE',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('VEE') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'blockv'
    ) ],
    [ Token.CYBERMILES, new Info(
      'CyberMiles',
      'CMT',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('CMT') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'cyberMiles'
    ) ],
    [ Token.RIPIO_CREDIT_NETWORK, new Info(
      'Ripio Credit Network',
      'RCN',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('RCN') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'ripioCreditNetwork'
    ) ],
    [ Token.TELCOIN, new Info(
      'Telcoin',
      'TEL',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('TEL') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'telcoin'
    ) ],
    [ Token.VIBE, new Info(
      'VIBE',
      'VIBE',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('VIBE') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'vibe'
    ) ],
    [ Token.SONM, new Info(
      'SONM',
      'SNM',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('SNM') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'sonm'
    ) ],
    [ Token.LOOM_NETWORK, new Info(
      'Loom Network',
      'LOOM',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('LOOM') || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      'loomNetwork'
    ) ]
  ]);

  constructor(
    private readonly currencyPriceService: CurrencyPriceService
  ) {
    this.currencyPriceService.getPrices();
  }

  public getInfo(currency: Coin | Token) {
    if (currency === null) {
      return null;
    }

    return this.staticInfo.get(currency);
  }
}
