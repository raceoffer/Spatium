import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as bsHelper from '../utils/transformers';
import { Coin, KeyChainService, Token, TokenEntry } from './keychain.service';
import { CurrencyPriceService } from './price.service';

import { map, distinctUntilChanged } from 'rxjs/operators';

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

export enum CurrencyServerName {
  Spatium = 'Spatium',
  Custom = 'Custom',
  BitPay = 'insight.bitpay.com',
  TestBitPay = 'test-insight.bitpay.com',
  Blockdozer = 'bch.blockdozer.com',
  Infura = 'mainnet.infura.io',
  Litecore = 'insight.litecore.io',
}

export class CurrencySettings {
  serverName: CurrencyServerName;
  serverUrl: string;

  constructor() {
    this.serverName = CurrencyServerName.Spatium;
  }
}

@Injectable()
export class CurrencyService {
  private readonly spatiumBaseUrl = 'http://185.219.80.169:8080';
  private readonly currencyApiServers = new Map<Coin | Token, Map<string, string>>([
    [Coin.BTC, new Map<string, string>([
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/bitcoin/mainnet/insights`],
      [CurrencyServerName.BitPay, 'https://insight.bitpay.com/api']
    ])],
    [Coin.BTC_test, new Map<string, string>([
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/bitcoin/testnet/insights`],
      [CurrencyServerName.TestBitPay, 'https://test-insight.bitpay.com/api']
    ])],
    [Coin.BCH, new Map<string, string>([
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/bitcoincash/mainnet/insights`],
      [CurrencyServerName.Blockdozer, 'https://bch.blockdozer.com/insight-api']
    ])],
    [Coin.ETH, new Map<string, string>([
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/etherium/testnet/infura`],
      [CurrencyServerName.Infura, 'https://rinkeby.infura.io/dlYX0gLUjGGCk7IBFq2C']
    ])],
    [Coin.LTC, new Map<string, string>([
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/lightcoin/mainnet/insights`],
      [CurrencyServerName.Litecore, 'https://insight.litecore.io/api']
    ])]
  ]);

  private readonly staticInfo = new Map<Coin | Token, Info>([
    [Coin.BTC, new Info(
      'Bitcoin',
      'BTC',
      100,
      20,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('BTC') || null),
          distinctUntilChanged()
        ),
        null)
    )],
    [Coin.BTC_test, new Info(
      'Bitcoin Test',
      'BTC',
      100,
      20,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('BTC') || null),
          distinctUntilChanged()
        ),
        null)
    )],
    [Coin.BCH, new Info(
      'Bitcoin Cash',
      'BCH',
      100,
      20,
      'BTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('BCH') || null),
          distinctUntilChanged()
        ),
        null)
    )],
    [Coin.ETH, new Info(
      'Ethereum',
      'ETH',
      5000000000,
      2000000000,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('ETH') || null),
          distinctUntilChanged()
        ),
        null)
    )],
    [Coin.LTC, new Info(
      'Litecoin',
      'LTC',
      100,
      20,
      'LTC/kb',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('LTC') || null),
          distinctUntilChanged()
        ),
        null)
    )],
  ]);


  constructor(
    private readonly keychain: KeyChainService,
    private readonly currencyPriceService: CurrencyPriceService
  ) {
    keychain.topTokens.forEach((tokenInfo) => {
      this.staticInfo.set(tokenInfo.token, this.getTokenInfo(tokenInfo));
    });

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
      5000000000,
      2000000000,
      'ETH/gas',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get(tokenEntry.ico) || null),
          distinctUntilChanged()
        ),
        null),
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('ETH') || null),
          distinctUntilChanged()
        ),
        null),
      tokenEntry.className
    );
  }

  public getAvailableApiServers(currency: Coin | Token): Map<string, string> {
    let servers = this.currencyApiServers.get(currency as Coin);
    if (!servers) {
      servers = this.currencyApiServers.get(Coin.ETH);
    }

    return servers;
  }

  public getApiServer(currency: Coin | Token): string {
    const settings = this.getSettings(currency);

    if (settings && settings.serverName === CurrencyServerName.Custom && settings.serverUrl) {
      return settings.serverUrl;
    }

    return this.getAvailableApiServers(currency).get(settings ? settings.serverName : CurrencyServerName.Spatium);
  }

  public getSettings(currency: Coin | Token): CurrencySettings {
    let jsonSettings: any;
    const settings: CurrencySettings = new CurrencySettings();

    jsonSettings = localStorage.getItem('settings.currency');
    if (jsonSettings) {
      jsonSettings = JSON.parse(jsonSettings)[currency];
    }

    if (!jsonSettings) {
      return settings;
    }

    settings.serverName = jsonSettings.serverName;
    settings.serverUrl = jsonSettings.serverUrl;
    return settings;
  }

  public saveSettings(currency: Coin | Token, settings: CurrencySettings) {
    let items: any = localStorage.getItem('settings.currency');
    items = items ? JSON.parse(items) : {};
    items[currency] = settings;
    localStorage.setItem('settings.currency', JSON.stringify(items));
  }
}
