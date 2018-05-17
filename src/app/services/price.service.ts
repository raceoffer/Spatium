import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject,  Observable, timer } from 'rxjs';

interface CoinMarketCupResponse {
  id: string;
  name: string;
  symbol: string;
  rank: string;
  price_usd: string;
  price_btc: string;
  last_updated: string;
}

@Injectable()
export class CurrencyPriceService {

  cryptowatUrl = 'https://api.cryptowat.ch';
  cryptowatPrices = '/markets/prices';
  coinmarketcapUrl = 'https://api.coinmarketcap.com';
  coinmarketcapPrices = '/v1/ticker/?limit=10000';

  hasPrices = false;

  public availableCurrencies: BehaviorSubject<Map<string, number>> = new BehaviorSubject<Map<string, number>>(new Map<string, number>());

  constructor(private http: HttpClient) { }

  getPrices() {
    const _timer = timer(2000, 5 * 60 * 1000);
    _timer.subscribe(() => {
      this.hasPrices = false;
      this.getCryptowat();
      this.getCoinmarketcap();
    });
  }

  getCryptowat() {
    this.http.get(this.cryptowatUrl + this.cryptowatPrices, {observe: 'response'})
      .subscribe(result => {

        if (result.status === 200 && !this.hasPrices) {
          console.log('Cryptowat');
          this.hasPrices = true;
          const availableCurrencies = new Map<string, number>();

          const data = result.body;
          for (const tmp in data['result']) {
            if (tmp.endsWith('usd')) {
              const currencyName = tmp.split(':')[1].replace('usd', '').toUpperCase();
              const currencyPrice = +data['result'][tmp];
              if (!availableCurrencies.get(currencyName)) {
                availableCurrencies.set(currencyName, currencyPrice);
              }
            }
          }

          this.availableCurrencies.next(availableCurrencies);
        } else {
          if (this.hasPrices) {
            console.log('Coinmarketcap is faster');
          } else {
            console.log('error ' + this.cryptowatUrl + this.cryptowatPrices + ': ' + result.status);
          }

        }
      });
  }

  getCoinmarketcap() {
    this.http.get<CoinMarketCupResponse[]>(this.coinmarketcapUrl + this.coinmarketcapPrices, {observe: 'response'})
      .subscribe(result => {

        if (result.status === 200 && !this.hasPrices) {
          console.log('Coinmarketcap');
          this.hasPrices = true;
          const availableCurrencies = new Map<string, number>();

          const data = result.body;
          for (const k in data) {
            const tmp = data[k];
            const currencyName = tmp.symbol.toUpperCase();
            const currencyPrice = +tmp.price_usd;
            if (currencyPrice !== null) {
              if (!availableCurrencies.get(currencyName)) {
                availableCurrencies.set(currencyName, currencyPrice);
              }
            }
          }

          this.availableCurrencies.next(availableCurrencies);
        } else {
          if (this.hasPrices) {
            console.log('Cryptowat is faster');
          } else {
            console.log('error ' + this.coinmarketcapUrl + this.coinmarketcapPrices + ': ' + result.status);
          }
        }
      });
  }

}
