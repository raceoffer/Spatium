import { Injectable } from '@angular/core';
import { Curve } from 'crypto-core-async';

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

export enum Cryptosystem {
  Ecdsa,
  Eddsa
}

export class CurrencyInfo {
  constructor(
    private _id: CurrencyId,
    private _derivationNumber: number,
    private _name: string,
    private _ticker: string,
    private _cryptosystem: Cryptosystem,
    private _curve: any
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

  get cryptosystem(): Cryptosystem {
    return this._cryptosystem;
  }

  get curve(): any {
    return this._curve;
  }
}

@Injectable()
export class CurrencyInfoService {
  private _currencies = new Map<CurrencyId, CurrencyInfo>([
    [CurrencyId.Bitcoin, new CurrencyInfo(
      CurrencyId.Bitcoin,
      0,
      'Bitcoin',
      'BTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.BitcoinTest, new CurrencyInfo(
      CurrencyId.BitcoinTest,
      1,
      'Bitcoin Test',
      'BTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.Litecoin, new CurrencyInfo(
      CurrencyId.Litecoin,
      2,
      'Litecoin',
      'LTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.LitecoinTest, new CurrencyInfo(
      CurrencyId.LitecoinTest,
      1,
      'Litecoin Test',
      'LTC',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.BitcoinCash, new CurrencyInfo(
      CurrencyId.BitcoinCash,
      145,
      'Bitcoin Cash',
      'BCH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.BitcoinCashTest, new CurrencyInfo(
      CurrencyId.BitcoinCashTest,
      1,
      'Bitcoin Cash Test',
      'BCH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.Ethereum, new CurrencyInfo(
      CurrencyId.Ethereum,
      60,
      'Ethereum',
      'ETH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.EthereumTest, new CurrencyInfo(
      CurrencyId.EthereumTest,
      1,
      'Ethereum Test',
      'ETH',
      Cryptosystem.Ecdsa,
      Curve.secp256k1
    )],
    [CurrencyId.Neo, new CurrencyInfo(
      CurrencyId.Neo,
      888,
      'Neo',
      'NEO',
      Cryptosystem.Ecdsa,
      Curve.p256
    )],
    [CurrencyId.NeoTest, new CurrencyInfo(
      CurrencyId.NeoTest,
      1,
      'Neo Test',
      'NEO',
      Cryptosystem.Ecdsa,
      Curve.p256
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

