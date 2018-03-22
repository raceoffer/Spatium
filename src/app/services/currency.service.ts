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
      'vechain'
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
      'omisego'
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
      'binacle'
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
      'digixdao'
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
      'populus'
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
