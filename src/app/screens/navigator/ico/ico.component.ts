import { IcoDetailsComponent } from './ico-details/ico-details.component';
import { Component, HostBinding, OnInit } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { IpfsService } from '../../../services/ipfs.service';
import { ICOService, IcoCampaign } from '../../../services/ico.service';
import { NewIcoComponent } from '../ico/new-ico/new-ico.component';

import { BehaviorSubject } from 'rxjs';

declare const window: any;

@Component({
  selector: 'app-ico',
  templateUrl: './ico.component.html',
  styleUrls: ['./ico.component.css']
})

export class IcoComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public title = 'ICO';
  public titles: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public filtredTitles: BehaviorSubject<any> = new BehaviorSubject<any>([]);;
  private _filterValue = '';
  public cols: any = Math.ceil(window.innerWidth / 350);
  public isSearch = false;

  ipfsCid = 'QmXza9Tx6vGNZwieKFZequpdd2xeN9Bo8XprQNV3jRN9Vv';

  constructor(
    private readonly navigationService: NavigationService,
    private readonly icoService: ICOService,
    private readonly ipfsService: IpfsService
  ) {
  }

  async ngOnInit() {
    let campaings = await this.icoService.getCampaignList();

    this.titles.next(campaings.map(function (value, index) {
      return {
        cols: 1,
        rows: 1,
        address: value.address,
        title: value.title,
        ipfsHash: value.ipfsHash,
        about: '',
        symbols: '',
        className: '',
        transactions: '',
        balances: '',
        coins: [],
      };
    }));

    this.filtredTitles.next(this.titles.value);
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
      this.filtredTitles.next(this.titles.value.filter(
        t => (t.title.toUpperCase().includes(this._filterValue.toUpperCase()) ||
          t.symbols.includes(this._filterValue.toUpperCase()))
      ));
    } else {
      this.filtredTitles.next(this.titles.value);
    }
  }

  public onNavRequest() {
    this.navigationService.toggleNavigation();
  }

  public clearFilterValue() {
    this.filterValue = '';
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

  goToNewICO() {
    const componentRef = this.navigationService.pushOverlay(NewIcoComponent);
    componentRef.instance.created.subscribe(campaign => {
      this.titles.next(this.titles.value.push({
        cols: 1,
        rows: 1,
        address: campaign.address,
        title: campaign.title,
        about: '',
        symbols: '',
        className: '',
        transactions: '',
        balances: '',
        coins: [],
      }));
      this.navigationService.acceptOverlay();
    });
  }

  public async onTileClicked(project: any) {
    const componentRef = this.navigationService.pushOverlay(IcoDetailsComponent);
    componentRef.instance.project = project;
  }

  async getLogo(tile) {
    if (tile.logo || tile.logo.length == 0) {
      return tile.logo;
    }

    return 'http://ipfs.io/ipfs/QmXza9Tx6vGNZwieKFZequpdd2xeN9Bo8XprQNV3jRN9Vv/logo';

    /*const logo = await this.ipfsService.get(tile.ipfsHash + '/logo');
    console.log(tile.title);
    console.log(logo);
    if (logo && logo.length > 0) {
      let src = "data:image/png;base64," + logo[0].content.toString('base64');
      tile.logo = src;
      return src;
    }
    return '';*/
  }

}

