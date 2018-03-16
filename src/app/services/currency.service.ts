import { Injectable } from '@angular/core';
import { Coin, Token } from './keychain.service';
import { CurrencyPriceService } from './price.service';
import * as bsHelper from '../utils/transformers';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class Info {
  name: string;
  symbol: string;
  rate: BehaviorSubject<number>;

  constructor(name: string, symbol: string, rate: BehaviorSubject<number>) {
    this.name = name;
    this.symbol = symbol;
    this.rate = rate;
  }
}

@Injectable()
export class CurrencyService {
  private readonly staticInfo = new Map<Coin | Token, Info>([
    [ Coin.BTC, new Info(
      'Bitcoin',
      'BTC',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTC') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Coin.BCH, new Info(
      'Bitcoin Cash',
      'BCH',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('BCH') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Coin.ETH, new Info(
      'Ethereum',
      'ETH',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH') || null).distinctUntilChanged(),
        null)
    ) ],
    [ Token.EOS, new Info(
      'EOS',
      'EOS',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.map(ac => ac.get('EOS') || null).distinctUntilChanged(),
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
