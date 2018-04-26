import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as bsHelper from '../utils/transformers';
import { Coin, KeyChainService, Token, TokenEntry } from './keychain.service';
import { CurrencyPriceService } from './price.service';

export class Info {
  name: string;
  symbol: string;
  gasPrice: number;
  gasPriceLow: number;
  gasUnit: string;
  rate: BehaviorSubject<number>;
  gasRate: BehaviorSubject<number>;
  icon: string = null;

  constructor(name: string,
              symbol: string,
              gasPrice: number,
              gasPriceLow: number,
              gasUnit: string,
              rate: BehaviorSubject<number>,
              gasRate?: BehaviorSubject<number>,
              icon?: string) {
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
    [Coin.BTC, new Info(
      'Bitcoin',
      'BTC',
      0.001,
      0.0002,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTC') || null).distinctUntilChanged(),
        null)
    )],
    [Coin.BTC_test, new Info(
      'Bitcoin Test',
      'BTC',
      0.001,
      0.0002,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTC') || null).distinctUntilChanged(),
        null)
    )],
    [Coin.BCH, new Info(
      'Bitcoin Cash',
      'BCH',
      0.001,
      0.0002,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BCH') || null).distinctUntilChanged(),
        null)
    )],
    [Coin.ETH, new Info(
      'Ethereum',
      'ETH',
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null)
    )],
    [Coin.LTC, new Info(
      'Litecoin',
      'LTC',
      0.001,
      0.0002,
      'LTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('LTC') || null).distinctUntilChanged(),
        null)
    )],
  ]);


  constructor(private readonly keychain: KeyChainService,
              private readonly currencyPriceService: CurrencyPriceService) {
    keychain.topTokens.forEach((tokenInfo) => {
      this.staticInfo.set(tokenInfo.token, this.getTokenInfo(tokenInfo));
    })

    this.currencyPriceService.getPrices();
  }

  public getInfo(currency: Coin | Token) {
    if (currency === null) {
      return null;
    }

    return this.staticInfo.get(currency);
  }

  public getTokenInfo(tokenEntry: TokenEntry) {
    return new Info(
      tokenEntry.name,
      tokenEntry.ico,
      0.000000005,
      0.000000002,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get(tokenEntry.ico) || null).distinctUntilChanged(),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null),
      tokenEntry.className
    )
  }
}
