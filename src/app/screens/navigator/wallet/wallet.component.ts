import { Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyService } from '../../../services/currency.service';
import { Coin, KeyChainService, TokenEntry } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBehaviourSubject } from '../../../utils/transformers';

declare const navigator: any;

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;

  public cols: any = 2;

  public title = 'Wallet';
  public isExitTap = false;
  public isSearch = false;
  public filtredTitles = [];

  public titles: any = [
    {title: 'Bitcoin', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC},
    {title: 'Bitcoin Cash', symbols: 'BCH', cols: 1, rows: 1, logo: 'bitcoin-cash', coin: Coin.BCH},
    {title: 'Ethereum', symbols: 'ETH', cols: 1, rows: 1, logo: 'ethereum', coin: Coin.ETH},
    {title: 'Litecoin', symbols: 'LTC', cols: 1, rows: 1, logo: 'litecoin', coin: Coin.LTC},
    {title: 'Cardano', symbols: 'ADA', cols: 1, rows: 1, logo: 'cardano'},
    {title: 'NEO', symbols: 'NEO', cols: 1, rows: 1, logo: 'neo'},
    {title: 'Ripple', symbols: 'XRP', cols: 1, rows: 1, logo: 'ripple'},
    {title: 'Stellar', symbols: 'XLM', cols: 1, rows: 1, logo: 'stellar'},
    {title: 'NEM', symbols: 'XEM', cols: 1, rows: 1, logo: 'nem'}
  ];

  private _filterValue = '';

  private tileBalanceInfo = {};

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly keychain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly currency: CurrencyService,
    private readonly wallet: WalletService
  ) {
    keychain.topTokens.forEach((tokenInfo) => {
      this.titles.push(WalletComponent.tokenEntry(tokenInfo));
    });

    this.titles.push(
      {title: 'Bitcoin Test', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC_test}
    );

    this.filtredTitles = this.titles;
  }

  get filterValue() {
    return this._filterValue;
  }

  set filterValue(newUserName) {
    this._filterValue = newUserName;
    if (this._filterValue.length > 0) {
      this.filtredTitles = this.titles.filter(
        t => (t.title.toUpperCase().includes(this._filterValue.toUpperCase()) ||
          t.symbols.includes(this._filterValue.toUpperCase()))
      );
    } else {
      this.filtredTitles = this.titles;
    }
  }

  public onNavRequest() {
    this.navigationService.toggleNavigation();
  }

  public clearFilterValue() {
    this.filterValue = '';
  }

  public static tokenEntry(tokenInfo: TokenEntry) {
    return {
      title: tokenInfo.name,
      symbols: tokenInfo.ico,
      logo: tokenInfo.className,
      cols: 1,
      rows: 1,
      coin: tokenInfo.token
    };
  }

  ngOnInit() {
    this.onResize();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onTileClicked(coin: Coin) {
    await this.router.navigate(['/navigator', {outlets: {'navigator': ['currency', coin]}}]);
  }

  toggleSearch(value) {
    this.isSearch = value;
    this.clearFilterValue();
  }

  async onBackClicked() {
    if (this.isSearch) {
      this.filterValue = '';
      this.isSearch = false;
    }
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
  }

  async goToSync() {
    await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
  }

  async cancelSync() {
    await this.openDialog();
  }

  async openDialog() {
    navigator.notification.confirm(
      'Syncronize with another device',
      async (buttonIndex) => {
        if (buttonIndex === 1) { // yes
          await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
        }
      },
      '',
      ['YES', 'NO']
    );
  }

  public getTileBalanceInfo(coin: any) {
    if (coin === undefined || coin === null) {
      return undefined;
    }

    if (this.tileBalanceInfo[coin] !== undefined) {
      return this.tileBalanceInfo[coin];
    }

    const currencyInfo = this.currency.getInfo(coin);
    const currencyWallet = this.wallet.currencyWallets.get(coin);
    const balanceUnconfirmed = toBehaviourSubject(
      currencyWallet.balance.pipe(map(balance => balance ? currencyWallet.fromInternal(balance.unconfirmed) : null)),
      null);
    this.tileBalanceInfo[coin] = {
      balance: balanceUnconfirmed,
      balanceUSD: toBehaviourSubject(combineLatest(
        balanceUnconfirmed,
        currencyInfo.rate,
        (balance, rate) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }), null)
    };

    return this.tileBalanceInfo[coin];
  }
}
