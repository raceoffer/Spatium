import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { CurrencyId } from './currencyinfo.service';

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
    [CurrencyId.Nem, new Map<FeeLevel, number>([
      [FeeLevel.High, 0],
      [FeeLevel.Normal, 0],
      [FeeLevel.Low, 0]
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
    [CurrencyId.NemTest, new Map<FeeLevel, number>([
      [FeeLevel.High, 0],
      [FeeLevel.Normal, 0],
      [FeeLevel.Low, 0]
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
