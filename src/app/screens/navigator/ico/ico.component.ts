import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Coin } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { NewIcoComponent } from '../ico/new-ico/new-ico.component';
import { WaitingComponent } from '../waiting/waiting.component';
import { IcoDetailsComponent } from './ico-details/ico-details.component';
import { requestDialog } from "../../../utils/dialog";

declare const navigator: any;
declare const window: any;

@Component({
  selector: 'app-ico',
  templateUrl: './ico.component.html',
  styleUrls: ['./ico.component.css']
})

export class IcoComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public title = 'ICO';
  public titles: any = [];
  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;
  public cols: any = Math.ceil(window.innerWidth / 350);
  public isSearch = false;
  public filtredTitles = [];
  public staticProjects: any = [
    {
      title: 'Example',
      cols: 1, rows: 1,
      about: '',
      symbols: 'EXMPL',
      className: 'spatium-ico',
      transactions: '',
      balances: '',
      address: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX',
      coins: [
        {place: Coin.BTC, name: 'Bitcoin'},
        {place: Coin.ETH, name: 'Ethereum'},
        {place: Coin.BCH, name: 'Bitcoin Cash'},
        {place: Coin.LTC, name: 'Litecoin'}
      ]
    },
  ];

  constructor(private readonly navigationService: NavigationService,
              private readonly wallet: WalletService,) {
    this.titles = this.staticProjects;

    this.filtredTitles = this.titles;
  }

  private _filterValue = '';

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
      this.filtredTitles = this.staticProjects;
    }
  }

  async ngOnInit() {

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

  public async goToSync() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connected.subscribe(device => {
      this.navigationService.acceptOverlay();
      console.log('Connected to', device);
    });
  }

  goToNewICO() {
    const componentRef = this.navigationService.pushOverlay(NewIcoComponent);
  }

  public async cancelSync() {
    if (await requestDialog('Syncronize with another device')) {
      await this.goToSync();
    }
  }

  public async onTileClicked(project: any) {
    console.log(project);
    const componentRef = this.navigationService.pushOverlay(IcoDetailsComponent);
    componentRef.instance.project = project;
  }
}

