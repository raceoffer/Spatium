import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { Input} from '@angular/core';
import { IcoDetailsComponent } from './ico-details/ico-details.component';
import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CurrencyService } from '../../../services/currency.service';
import { Coin, KeyChainService, TokenEntry } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { BluetoothService } from "../../../services/bluetooth.service";
import { NewIcoComponent } from "../ico/new-ico/new-ico.component";
import { WaitingComponent } from "../waiting/waiting.component";

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
  private _filterValue = '';
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
      symbols:'EXMPL', 
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

  constructor(
    private readonly navigationService: NavigationService,
    private readonly wallet: WalletService,
  ) {
    this.titles = this.staticProjects;

    this.filtredTitles = this.titles;
  }

  async ngOnInit() {

  }

  get filterValue() {
    return this._filterValue;
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
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
    })
  }

  goToNewICO() {
    const componentRef = this.navigationService.pushOverlay(NewIcoComponent);
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

  public async onTileClicked(project: any) {
    console.log(project);
    const componentRef = this.navigationService.pushOverlay(IcoDetailsComponent);
    componentRef.instance.project = project;
  }
}

