import { Component, HostBinding, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { BluetoothService } from '../../../services/bluetooth.service';
import { CurrencyService } from '../../../services/currency.service';
import { Coin, KeyChainService, TokenEntry } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { toBehaviourSubject } from '../../../utils/transformers';

declare const navigator: any;

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  synchronizing = this.wallet.synchronizing;
  ready = this.wallet.ready;
  cancelled = this.wallet.cancelled;
  failed = this.wallet.failed;
  status = this.wallet.status;
  cols: any = 2;
  public isOpened = false;
  public title = 'Wallet';
  public isExitTap = false;
  public isSearch = false;
  public filtredTitles = [];
  public navLinks = [{
    name: 'Wallet',
    link: ['/navigator', {outlets: {navigator: ['wallet']}}],
    isSelected: true,
    isActive: true
  }, {
    name: 'Exchange',
    link: '',
    isSelected: false,
    isActive: false
  }, {
    name: 'ICO',
    link: '',
    isSelected: false,
    isActive: false
  }, {
    name: 'Portfolio Investment',
    link: '',
    isSelected: false,
    isActive: false
  }, {
    name: 'Verification',
    link: '',
    isSelected: false,
    isActive: false
  }, {
    name: 'Settings',
    link: ['/navigator', {outlets: {navigator: ['settings']}}],
    isSelected: false,
    isActive: true
  }, {
    name: 'Exit',
    link: ['/start'],
    isSelected: false,
    isActive: true
  }];
  public titles : any = [
    {title: 'Bitcoin', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC},
    {title: 'Bitcoin Test', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC_test},
    {title: 'Bitcoin Cash', symbols: 'BCH', cols: 1, rows: 1, logo: 'bitcoin-cash', coin: Coin.BCH},
    {title: 'Ethereum', symbols: 'ETH', cols: 1, rows: 1, logo: 'ethereum', coin: Coin.ETH},
    {title: 'Litecoin', symbols: 'LTC', cols: 1, rows: 1, logo: 'litecoin', coin: Coin.LTC},
    {title: 'Cardano', symbols: 'ADA', cols: 1, rows: 1, logo: 'cardano'},
    {title: 'NEO', symbols: 'NEO', cols: 1, rows: 1, logo: 'neo'},
    {title: 'Ripple', symbols: 'XRP', cols: 1, rows: 1, logo: 'ripple'},
    {title: 'Stellar', symbols: 'XLM', cols: 1, rows: 1, logo: 'stellar'},
    {title: 'NEM', symbols: 'XEM', cols: 1, rows: 1, logo: 'nem'}
  ];

  private tileBalanceInfo = {};

  @ViewChild('sidenav') sidenav;
  private subscriptions = [];

  constructor(public dialog: MatDialog,
              private readonly bt: BluetoothService,
              private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly keychain: KeyChainService,
              private readonly notification: NotificationService,
              private readonly navigationService: NavigationService,
              private readonly currency: CurrencyService,
              private readonly wallet: WalletService) {
    keychain.topTokens.forEach((tokenInfo) => {
      this.titles.push(this.tokenEntry(tokenInfo));
    });
    this.filtredTitles = this.titles;
  }

  public _filterValue = '';

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

  clearFilterValue() {
    this.filterValue = '';
  }

  public tokenEntry(tokenInfo: TokenEntry) {
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
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.onResize();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async onNav(navLink) {
    await this.router.navigate(navLink.link);
  }

  public toggle() {
    this.isOpened = !this.isOpened;
  }

  async onTileClicked(coin: Coin) {
    console.log(coin);
    await this.router.navigate(['/navigator', {outlets: {'navigator': ['currency', coin]}}]);
  }

  async toggleSearch(value) {
    this.isSearch = value;
  }

  async onBackClicked() {
    if (this.isSearch) {
      this.filterValue = '';
      this.isSearch = false;
    } else if (this.isOpened) {
      console.log('isOpened');
      this.sidenav.toggle();
    } else if (this.isExitTap) {
      console.log('isExitTap');
      this.notification.hide();
      await this.router.navigate(['/start']);
    } else {
      console.log('await');
      this.notification.show('Tap again to exit');
      this.isExitTap = true;
      setTimeout(() => this.ngZone.run(() => {
        this.isExitTap = false;
      }), 3000);
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
          await this.bt.disconnect();
          await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
        }
      },
      '',
      ['YES', 'NO']
    );
  }

  public getTileBalanceInfo(coin : any) {
    if(!coin)
      return undefined;

    if(this.tileBalanceInfo[coin] !== undefined)
      return this.tileBalanceInfo[coin];

    const currencyInfo = this.currency.getInfo(coin);
    const currencyWallet = this.wallet.currencyWallets.get(coin);
    var balanceConfirmed = toBehaviourSubject(currencyWallet.balance.map(balance => balance.confirmed), null)
    this.tileBalanceInfo[coin] = {
      balance: balanceConfirmed,
      balanceUSD: toBehaviourSubject(combineLatest(
        balanceConfirmed,
        currencyInfo.rate,
        (balance, rate) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }), null)
    }

    return this.tileBalanceInfo[coin];
  }
}
