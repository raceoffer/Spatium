import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CurrencyService } from '../../../services/currency.service';
import { Coin, KeyChainService, TokenEntry } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { BluetoothService } from "../../../services/bluetooth.service";
import { NewIcoComponent } from "../ico/new-ico/new-ico.component";
import { WaitingComponent } from "../waiting/waiting.component";

declare const window: any;
declare const navigator: any;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;

  public cols: any = Math.ceil(window.innerWidth / 350);

  public title = 'Wallet';
  public isSearch = false;
  public typeOfTiles = '';
  public filtredTitles = [];

  public staticTitles: any = [
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

  public staticProjects: any = [
    {title: 'SPATIUM', cols: 1, rows: 1, about: '', className: 'spatium-ico', opened: true, transactions: '', balances: '', address: 'WLOD_IS_LOVE', id: 'spatium', coins: [
      {place: Coin.BTC, name: 'Bitcoin'},
      {place: Coin.ETH, name: 'Ethereum'},
      {place: Coin.NEM, name: 'New economy movement'},
      {place: Coin.LTC, name: 'Litecoin'}]},
    {title: 'PROJECT', cols: 1, rows: 1, about: '', className: 'project-ico', opened: true, transactions: '', balances: '', address: 'BABY_DONT_HURT_ME', id: 'project', coins: [
      {place: Coin.BTC, name: 'Bitcoin'},
      {place: Coin.ETH, name: 'Ethereum'},
      {place: Coin.NEM, name: 'New economy movement'},
      {place: Coin.LTC, name: 'Litecoin'}]},
  ];

  public titles: any = [];

  private _filterValue = '';

  private subscriptions = [];

  constructor(
    private readonly navigationService: NavigationService,
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService,
    private readonly keychain: KeyChainService,
  ) {
    const titles = this.staticTitles;

    keychain.topTokens.forEach((tokenInfo) => {
      titles.push(MainComponent.tokenEntry(tokenInfo));
    });

    titles.push(
      {title: 'Bitcoin Test', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC_test}
    );

    this.titles = titles;

    this.filtredTitles = this.titles;
  }

  async ngOnInit() {
    if (!this.bt.connected.getValue()) {
      await this.goToSync();
    }

    this.subscriptions.push(
      this.route.params.subscribe(async (params: Params) => {
        this.typeOfTiles = params['type'];
        this.filtredTitles = (this.typeOfTiles === 'ico')?this.staticProjects:this.staticTitles;
        this.title = (this.typeOfTiles === 'ico')?'ICO':'Wallet';
      })
    );
  }

  get filterValue() {
    return this._filterValue;
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
  }

  set filterValue(newUserName) {
    this._filterValue = newUserName;
    if (this.typeOfTiles === 'ico') {
      if (this._filterValue.length > 0) {
        this.filtredTitles = this.staticProjects.filter(
          t => t.title.toUpperCase().includes(this._filterValue.toUpperCase())
        );
      } else {
        this.filtredTitles = this.staticProjects;
      }
    } else {
      if (this._filterValue.length > 0) {
        this.filtredTitles = this.titles.filter(
          t => (t.title.toUpperCase().includes(this._filterValue.toUpperCase()) ||
            t.symbols.includes(this._filterValue.toUpperCase()))
        );
      } else {
        this.filtredTitles = this.titles;
      }
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

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public toggleSearch(value) {
    this.isSearch = value;
    this.clearFilterValue();
  }

  public async onBack() {
    if (this.isSearch) {
      this.filterValue = '';
      this.isSearch = false;
    }
  }

  public async goToSync() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connected.subscribe(device => {
      this.navigationService.acceptOverlay();
      console.log('Connected to', device);
    })
  }

  goToNewICO() {
    const overalyRef = this.navigationService.pushOverlay(NewIcoComponent);
  }

  public async cancelSync() {
    await this.openDialog();
  }

  public async openDialog() {
    navigator.notification.confirm(
      'Syncronize with another device',
      async (buttonIndex) => {
        if (buttonIndex === 1) { // yes
          await this.goToSync();
        }
      },
      '',
      ['YES', 'NO']
    );
  }
}