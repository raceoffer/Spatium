import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as bsHelper from '../utils/transformers';
import { Coin, KeyChainService, Token, TokenEntry } from './keychain.service';
import { CurrencyPriceService } from './price.service';
import { StorageService } from './storage.service';

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

export enum CurrencyServerName {
  Spatium = 'Spatium',
  Custom = 'Custom',
  BitPay = 'insight.bitpay.com',
  TestBitPay = 'test-insight.bitpay.com',
  Blockdozer = 'bch.blockdozer.com',
  Infura = 'mainnet.infura.io',
  Litecore = 'insight.litecore.io',
  Native = 'Nem native',
}

export class CurrencySettings {
  serverName: CurrencyServerName;
  serverUrl: string;

  constructor(currency: Coin | Token = null) {
    // Nem do not have a spatium provider yet
    if (currency === Coin.NEM) {
      this.serverName = CurrencyServerName.Native;
    } else {
      this.serverName = CurrencyServerName.Spatium;
    }
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
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/etherium/mainnet/infura`],
      [CurrencyServerName.Infura, 'https://mainnet.infura.io/dlYX0gLUjGGCk7IBFq2C']
    ])],
    [Coin.LTC, new Map<string, string>([
      [CurrencyServerName.Spatium, `${this.spatiumBaseUrl}/api/lightcoin/mainnet/insights`],
      [CurrencyServerName.Litecore, 'https://insight.litecore.io/api']
    ])],
    [Coin.NEM, new Map<string, string>([
      [CurrencyServerName.Native, 'http://hugealice3.nem.ninja']
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
        null),
        null,
        'bitcoin'
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
        null),
        null,
        'bitcoin'
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
        null),
        null,
        'bitcoin-cash'
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
        null),
        null,
        'ethereum'
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
        null),
        null,
        'litecoin'
    )],
    [Coin.NEM, new Info(
      'NEM',
      'NEM',
      50000,
      30000,
      'NEM/tx',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('XEM') || null),
          distinctUntilChanged()
        ),
        null),
      null,
      'nem'
    )],
    [Coin.ADA, new Info(
      'Cardano',
      'ADA',
      50000,
      30000,
      'ADA/tx',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('ADA') || null),
          distinctUntilChanged()
        ),
        null),
      null,
      'cardano'
    )],
    [Coin.NEO, new Info(
      'NEO',
      'NEO',
      50000,
      30000,
      'NEO/tx',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('NEO') || null),
          distinctUntilChanged()
        ),
        null),
      null,
      'neo'
    )],
    [Coin.XRP, new Info(
      'Ripple',
      'XRP',
      50000,
      30000,
      'XRP/tx',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('XRP') || null),
          distinctUntilChanged()
        ),
        null),
      null,
      'ripple'
    )],
    [Coin.XLM, new Info(
      'Stellar',
      'XLM',
      50000,
      30000,
      'XLM/tx',
      bsHelper.toBehaviourSubject(
        this.currencyPriceService.availableCurrencies.pipe(
          map(ac => ac.get('XLM') || null),
          distinctUntilChanged()
        ),
        null),
      null,
      'stellar'
    )]
  ]);

  constructor(
    private readonly keychain: KeyChainService,
    private readonly currencyPriceService: CurrencyPriceService,
    private readonly storage: StorageService
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

  public async getApiServer(currency: Coin | Token) {
    const settings = await this.getSettings(currency);

    if (settings && settings.serverName === CurrencyServerName.Custom && settings.serverUrl) {
      return settings.serverUrl;
    }

    return this.getAvailableApiServers(currency).get(settings ? settings.serverName : CurrencyServerName.Spatium);
  }

  public async getSettings(currency: Coin | Token) {
    let jsonSettings: any;
    const settings: CurrencySettings = new CurrencySettings(currency);

    jsonSettings = await this.storage.getValue('settings.currency');
    if (jsonSettings) {
      jsonSettings = jsonSettings[currency];
    }

    if (!jsonSettings) {
      return settings;
    }

    settings.serverName = jsonSettings.serverName;
    settings.serverUrl = jsonSettings.serverUrl;
    return settings;
  }

  public async saveSettings(currency: Coin | Token, settings: CurrencySettings) {
    let items: any = await this.storage.getValue('settings.currency');
    items = items ? JSON.parse(items) : {};
    items[currency] = settings;
    await this.storage.setValue('settings.currency', items);
  }
}
