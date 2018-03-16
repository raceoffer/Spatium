import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';


@Injectable()
export class CurrencyPriceService {

  priceUrl = 'https://api.cryptowat.ch/markets/prices';
  public availableCurrencies: BehaviorSubject<Map<string, number>> = new BehaviorSubject<Map<string, number>>(new Map<string, number>());

  constructor(private http: HttpClient) {  }

  getPrices() {
    const timer = Observable.timer(2000, 60 * 1000);
    timer.subscribe(() => {
      this.http.get(this.priceUrl)
        .subscribe(data => {
          const availableCurrencies = new Map<string, number>();

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
        });
    });
  }

}

