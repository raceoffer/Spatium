import { Injectable } from '@angular/core';
import { Coin, Token } from './keychain.service';
import {CurrencyPriceService} from './price.service';
import {Observable} from 'rxjs/Observable';

export class Info {
  name: string;
  symbol: string;
  rate: Observable<number>;

  constructor(name: string, symbol: string, rate: Observable<number>) {
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
      this.currencyPriceService.availableCurrencies.map(ac => ac.get('BTC')).distinctUntilChanged()
    ) ],
    [ Coin.BCH, new Info(
      'Bitcoin Cash',
      'BCH',
      this.currencyPriceService.availableCurrencies.map(ac => ac.get('BCH')).distinctUntilChanged()
    ) ],
    [ Coin.ETH, new Info(
      'Ethereum',
      'ETH',
      this.currencyPriceService.availableCurrencies.map(ac => ac.get('ETH')).distinctUntilChanged()
    ) ],
    [ Token.EOS, new Info(
      'EOS',
      'EOS',
      this.currencyPriceService.availableCurrencies.map(ac => ac.get('EOS')).distinctUntilChanged()
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

    const info = this.staticInfo.get(currency);
    // get real-time price if needed
    return info;
  }
}
