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

  constructor(
    name: string,
    symbol: string,
    gasPrice: number,
    gasPriceLow: number,
    gasUnit: string,
    rate: BehaviorSubject<number>,
    gasRate?: BehaviorSubject<number>
  ) {
    this.name = name;
    this.symbol = symbol;
    this.gasPrice = gasPrice;
    this.gasPriceLow = gasPriceLow;
    this.gasUnit = gasUnit;
    this.rate = rate;
    this.gasRate = gasRate || rate;
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
        null)
    ) ]
  ]);

  constructor(
    private readonly currencyPriceService: CurrencyPriceService
  ) {
    this.currencyPriceService.getPrices();
  }

  async getInfo(currency: Coin | Token) {
    if (currency === null) {
      return null;
    }

    return this.staticInfo.get(currency);
  }
}
