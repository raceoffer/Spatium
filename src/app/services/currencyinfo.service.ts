import { Injectable } from '@angular/core';

export enum CurrencyId {
  Bitcoin,
  BitcoinTest,
  Litecoin,
  LitecoinTest,
  BitcoinCash,
  BitcoinCashTest,
  Ethereum,
  EthereumTest,
  Neo,
  NeoTest
}

export class CurrencyInfo {
  constructor(
    private _id: CurrencyId,
    private _derivationNumber: number,
    private _name: string,
    private _ticker: string
  ) {}

  get id(): CurrencyId {
    return this._id;
  }

  get derivationNumber(): number {
    return this._derivationNumber;
  }

  get name(): string {
    return this._name;
  }

  get ticker(): string {
    return this._ticker;
  }
}

@Injectable()
export class CurrencyInfoService {
  private _currencies = new Map<CurrencyId, CurrencyInfo>([
    [CurrencyId.Bitcoin, new CurrencyInfo(
      CurrencyId.Bitcoin,
      0,
      'Bitcoin',
      'BTC'
    )],
    [CurrencyId.BitcoinTest, new CurrencyInfo(
      CurrencyId.BitcoinTest,
      1,
      'Bitcoin Test',
      'BTC'
    )],
    [CurrencyId.Litecoin, new CurrencyInfo(
      CurrencyId.Litecoin,
      2,
      'Litecoin',
      'LTC'
    )],
    [CurrencyId.LitecoinTest, new CurrencyInfo(
      CurrencyId.LitecoinTest,
      1,
      'Bitcoin Test',
      'LTC'
    )],
    [CurrencyId.BitcoinCash, new CurrencyInfo(
      CurrencyId.BitcoinCash,
      145,
      'Bitcoin Cash',
      'BCH'
    )],
    [CurrencyId.BitcoinCashTest, new CurrencyInfo(
      CurrencyId.BitcoinCashTest,
      1,
      'Bitcoin Cash Test',
      'BCH'
    )],
    [CurrencyId.Ethereum, new CurrencyInfo(
      CurrencyId.Ethereum,
      60,
      'Ethereum',
      'ETH'
    )],
    [CurrencyId.EthereumTest, new CurrencyInfo(
      CurrencyId.EthereumTest,
      1,
      'Ethereum Test',
      'ETH'
    )],
    [CurrencyId.Neo, new CurrencyInfo(
      CurrencyId.Neo,
      888,
      'Neo',
      'NEO'
    )],
    [CurrencyId.NeoTest, new CurrencyInfo(
      CurrencyId.NeoTest,
      1,
      'Neo Test',
      'NEO'
    )]
  ]);

  private _syncOrder = [
    CurrencyId.Bitcoin,
    CurrencyId.Litecoin,
    CurrencyId.BitcoinCash,
    CurrencyId.Ethereum,
    CurrencyId.Neo,
    CurrencyId.BitcoinTest,
    CurrencyId.LitecoinTest,
    CurrencyId.BitcoinCashTest,
    CurrencyId.EthereumTest,
    CurrencyId.NeoTest
  ];

  currencyInfo(id: CurrencyId): CurrencyInfo {
    return this._currencies.get(id);
  }

  get syncOrder(): CurrencyId[] {
    return this._syncOrder;
  }
}

