import { AfterViewInit, ChangeDetectorRef, Component, HostBinding, OnDestroy } from '@angular/core';
import { combineLatest, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrencyService } from '../../../services/currency.service';
import { Coin, KeyChainService, TokenEntry } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { requestDialog } from '../../../utils/dialog';
import { toBehaviourSubject } from '../../../utils/transformers';
import { CurrencyComponent } from '../currency/currency.component';
import { WaitingComponent } from '../waiting/waiting.component';

declare const navigator: any;

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnDestroy, AfterViewInit {
  @HostBinding('class') classes = 'toolbars-component';

  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;

  public cols: any = Math.ceil(window.innerWidth / 350);

  public title = 'Wallet';
  public isSearch = false;
  public filteredTitles = [];

  public staticTitles: any = [
    {title: 'Bitcoin', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC},
    {title: 'Bitcoin Cash', symbols: 'BCH', cols: 1, rows: 1, logo: 'bitcoin-cash', coin: Coin.BCH},
    {title: 'Ethereum', symbols: 'ETH', cols: 1, rows: 1, logo: 'ethereum', coin: Coin.ETH},
    {title: 'Litecoin', symbols: 'LTC', cols: 1, rows: 1, logo: 'litecoin', coin: Coin.LTC},
    {title: 'NEM', symbols: 'XEM', cols: 1, rows: 1, logo: 'nem', coin: Coin.NEM},
    {title: 'Cardano', symbols: 'ADA', cols: 1, rows: 1, logo: 'cardano'},
    {title: 'NEO', symbols: 'NEO', cols: 1, rows: 1, logo: 'neo'},
    {title: 'Ripple', symbols: 'XRP', cols: 1, rows: 1, logo: 'ripple'},
    {title: 'Stellar', symbols: 'XLM', cols: 1, rows: 1, logo: 'stellar'},
  ];

  public titles: any = [];
  private tileBalanceInfo = {};
  private subscriptions = [];

  constructor(private readonly keychain: KeyChainService,
              private readonly navigationService: NavigationService,
              private readonly currency: CurrencyService,
              private readonly wallet: WalletService,
              private readonly changeDetector: ChangeDetectorRef) {
    const titles = this.staticTitles;

    keychain.topTokens.forEach((tokenInfo) => {
      titles.push(WalletComponent.tokenEntry(tokenInfo));
    });

    titles.push(
      {title: 'Bitcoin Test', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC_test}
    );

    this.titles = titles;

    this.filteredTitles = this.titles;
  }

  private _filterValue = '';

  get filterValue() {
    return this._filterValue;
  }

  set filterValue(newUserName) {
    this._filterValue = newUserName;
    if (this._filterValue.length > 0) {
      this.filteredTitles = this.titles.filter(
        t => (
          t.title.toUpperCase().includes(this._filterValue.toUpperCase()) ||
          t.symbols.includes(this._filterValue.toUpperCase())
        )
      );
    } else {
      this.filteredTitles = this.titles;
    }
  }

  public static tokenEntry(tokenInfo: TokenEntry) {
    return {
      title: tokenInfo.name,
      symbols: tokenInfo.ico,
      logo: tokenInfo.className,
      cols: 1,
      rows: 1,
      coin: tokenInfo.token,
      erc20: true,
    };
  }

  ngAfterViewInit() {
    this.changeDetector.detach();
    this.subscriptions.push(interval(1000).subscribe(() => {
      this.changeDetector.detectChanges();
    }));
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
  }

  public onNavRequest() {
    this.navigationService.toggleNavigation();
  }

  public clearFilterValue() {
    this.filterValue = '';
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async onTileClicked(coin: Coin) {
    const componentRef = this.navigationService.pushOverlay(CurrencyComponent);
    componentRef.instance.currency = coin;
  }

  public toggleSearch(value) {
    this.isSearch = value;
    this.clearFilterValue();
  }

  public async onBackClicked() {
    if (this.isSearch) {
      this.filterValue = '';
      this.isSearch = false;
    }
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connected.subscribe(device => {
      this.navigationService.acceptOverlay();
      console.log('Connected to', device);
    });
  }

  public async cancelSync() {
    if (await requestDialog('Syncronize with another device')) {
      await this.openConnectOverlay();
    }
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
      balanceUSD: toBehaviourSubject(combineLatest([
        balanceUnconfirmed,
        currencyInfo.rate
      ]).pipe(map(
        ([balance, rate]) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }
      )), null)
    };

    return this.tileBalanceInfo[coin];
  }
}
