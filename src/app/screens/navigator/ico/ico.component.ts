import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { IcoDetailsComponent } from './ico-details/ico-details.component';
import { NavigationService } from '../../../services/navigation.service';
import { IpfsService } from '../../../services/ipfs.service';
import { ICOService, IcoCampaign } from '../../../services/ico.service';
import { NewIcoComponent } from './new-ico/new-ico.component';
import { Router } from '@angular/router';
import { SettingsComponent } from '../settings/settings.component';
import { FeedbackComponent } from '../../feedback/feedback.component';

import { BehaviorSubject } from 'rxjs';

declare const window: any;

@Component({
  selector: 'app-ico',
  templateUrl: './ico.component.html',
  styleUrls: ['./ico.component.css']
})

export class IcoComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public current = 'ICO';
  public navLinks = [{
    name: 'Wallet',
    clicked: async () => {
      await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
    }
  }, {
    name: 'Exchange'
  }, {
    name: 'ICO',
    class: 'ico',
    clicked: async () => {
      await this.router.navigate(['/navigator', {outlets: {navigator: ['ico']}}]);
    }
  }, {
    name: 'Portfolio Investment'
  }, {
    name: 'Verification'
  }, {
    name: 'Settings',
    clicked: () => {
      this.openSettings();
    }
  }, {
    name: 'Feedback',
    clicked: () => {
      this.openFeedback();
    }
  }, {
    name: 'Exit',
    clicked: async () => {
      await this.router.navigate(['/start']);
    }
  }];

  @ViewChild('sidenav') sidenav;

  public title = 'ICO';
  public titles: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public filtredTitles: BehaviorSubject<any> = new BehaviorSubject<any>([]);;
  private _filterValue = '';
  public cols: any = Math.ceil(window.innerWidth / 350);
  public isSearch = false;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly router: Router,
    private readonly icoService: ICOService,
    private readonly ipfsService: IpfsService
  ) {}

  async ngOnInit() {
    let campaings = await this.icoService.getCampaignList();

    this.titles.next(campaings.map(function (value, index) {
      return {
        cols: 1,
        rows: 1,
        address: value.address,
        title: value.title,
        ipfsHash: value.ipfsFolder,
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

  public openSettings() {
    const componentRef = this.navigationService.pushOverlay(SettingsComponent);
  }

  public openFeedback() {
    const componentRef = this.navigationService.pushOverlay(FeedbackComponent);
  }

  public toggleNavigation() {
    this.sidenav.toggle();
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
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
        ipfsHash: campaign.ipfsFolder,
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

    const logo = await this.ipfsService.get(tile.ipfsHash + '/logo');
    console.log(tile.title);
    console.log(logo);
    if (logo && logo.length > 0) {
      let src = "data:image/png;base64," + logo[0].content.toString('base64');
      tile.logo = src;
      return src;
    }
    return '';
  }

}

