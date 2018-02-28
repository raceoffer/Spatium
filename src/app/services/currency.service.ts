import { Injectable } from '@angular/core';
import { Coin, Token, KeyChainService } from './keychain.service';

export class Info {
  constructor(
    public name: string,
    public symbol: string,
    public rate: number
  ) {}
}

@Injectable()
export class CurrencyService {
  private readonly staticInfo = new Map<Coin | Token, Info>([
    [ Coin.BTC, new Info('Bitcoin', 'BTC', 15000) ],
    [ Coin.BCH, new Info('Bitcoin Cash', 'BCH', 10000) ],
    [ Coin.ETH, new Info('Ethereum', 'ETH', 900) ],
    [ Token.EOS, new Info('EOS', 'EOS', 1200) ]
  ]);

  constructor(
    private readonly keychain: KeyChainService
  ) { }

  async getInfo(currency: Coin | Token) {
    if (currency === null) {
      return null;
    }

    const info = this.staticInfo.get(currency);
    // get real-time price if needed
    return info;
  }
}
