import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { CurrencyId } from './currencyinfo.service';

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
          // tslint:disable-next-line:forin
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

export enum FeeLevel {
  High,
  Normal,
  Low
}

@Injectable()
export class PriceService {
  private _cryptowatUrl = 'https://api.cryptowat.ch/markets/prices';
  private _coinmarketcapUrl = 'https://api.coinmarketcap.com/v1/ticker/?limit=10000';

  private _requestTimer = timer(0, 5 * 60 * 1000);

  private _prices = new Map<string, number>();
  private _defaultfeePrice = new Map<CurrencyId, Map<FeeLevel, number>>([
    [CurrencyId.Bitcoin, new Map<FeeLevel, number>([
      [FeeLevel.High, 200],
      [FeeLevel.Normal, 100],
      [FeeLevel.Low, 20]
    ])],
    [CurrencyId.Litecoin, new Map<FeeLevel, number>([
      [FeeLevel.High, 200],
      [FeeLevel.Normal, 100],
      [FeeLevel.Low, 20]
    ])],
    [CurrencyId.BitcoinCash, new Map<FeeLevel, number>([
      [FeeLevel.High, 200],
      [FeeLevel.Normal, 100],
      [FeeLevel.Low, 20]
    ])],
    [CurrencyId.Ethereum, new Map<FeeLevel, number>([
      [FeeLevel.High, 10000000000],
      [FeeLevel.Normal, 5000000000],
      [FeeLevel.Low, 2000000000]
    ])],
    [CurrencyId.Neo, new Map<FeeLevel, number>([
      [FeeLevel.High, 0],
      [FeeLevel.Normal, 0],
      [FeeLevel.Low, 0]
    ])],
    [CurrencyId.BitcoinTest, new Map<FeeLevel, number>([
      [FeeLevel.High, 200],
      [FeeLevel.Normal, 100],
      [FeeLevel.Low, 20]
    ])],
    [CurrencyId.LitecoinTest, new Map<FeeLevel, number>([
      [FeeLevel.High, 200],
      [FeeLevel.Normal, 100],
      [FeeLevel.Low, 20]
    ])],
    [CurrencyId.BitcoinCashTest, new Map<FeeLevel, number>([
      [FeeLevel.High, 200],
      [FeeLevel.Normal, 100],
      [FeeLevel.Low, 20]
    ])],
    [CurrencyId.EthereumTest, new Map<FeeLevel, number>([
      [FeeLevel.High, 10000000000],
      [FeeLevel.Normal, 5000000000],
      [FeeLevel.Low, 2000000000]
    ])],
    [CurrencyId.NeoTest, new Map<FeeLevel, number>([
      [FeeLevel.High, 0],
      [FeeLevel.Normal, 0],
      [FeeLevel.Low, 0]
    ])]
  ]);

  public price(ticker: string): number {
    return this._prices.get(ticker.toUpperCase());
  }

  public feePrice(currencyId: CurrencyId, feeLevel: FeeLevel): number {
    return this._defaultfeePrice.get(currencyId).get(feeLevel);
  }

  constructor(private http: HttpClient) {
    this._requestTimer.subscribe(async () => {
      await Promise.all([
        this.getCryptowat(),
        this.getCoinmarketcap()
      ]);
    });
  }

  async getCryptowat() {
    const response = await this.http.get<any>(this._cryptowatUrl, {observe: 'response'}).pipe(
      take(1)
    ).toPromise();

    if (response.status === 200) {
      const data = response.body;

      for (const entry in data.result) {
        if (data.result.hasOwnProperty(entry) && entry.endsWith('usd')) {
          const name = entry.split(':')[1].replace('usd', '').toUpperCase();
          const price = +data.result[entry];

          if (price !== null) {
            this._prices.set(name, price);
          }
        }
      }
    }
  }

  async getCoinmarketcap() {
    const response = await this.http.get<any[]>(this._coinmarketcapUrl, {observe: 'response'}).pipe(
      take(1)
    ).toPromise();

    if (response.status === 200) {
      const data = response.body;

      for (const entry of data) {
        const name = entry.symbol.toUpperCase();
        const price = +entry.price_usd;

        if (price !== null) {
          this._prices.set(name, price);
        }
      }
    }
  }
}
