import { Component, HostBinding, Input, NgZone, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { SendTransactionComponent } from '../../send-transaction/send-transaction.component';
import { InvestmentsComponent } from '../investments/investments.component';
import { NotificationService } from '../../../../services/notification.service';
import { CurrencyService } from '../../../../services/currency.service';
import { NavigationService } from '../../../../services/navigation.service';
import { IpfsService, File } from '../../../../services/ipfs.service';

@Component({
  selector: 'app-ico-details',
  templateUrl: './ico-details.component.html',
  styleUrls: ['./ico-details.component.css'],
})
export class IcoDetailsComponent implements OnInit, AfterViewInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;
  public coin: any = undefined;
  public chosencurrency: any = undefined;
  public coins: any = [];

  ipfsCid = 'QmXza9Tx6vGNZwieKFZequpdd2xeN9Bo8XprQNV3jRN9Vv';

  constructor(
    private readonly notification: NotificationService,
    private readonly currency: CurrencyService,
    private readonly navigationService: NavigationService,
    private readonly ipfsService: IpfsService
  ) {  }

  ngOnInit() {
    this.project.coins.forEach((item) => {
      this.coins.push({
          'icon': this.currency.getInfo(item.place).icon,
          'symbol': this.currency.getInfo(item.place).symbol,
          'coin': item.place,
          'name': item.name,
          'chosen': false, 
      })
    });
  }

  ngAfterViewInit() {
    this.loadDescription();
    this.loadLogo();
  }

  async onBack() {
    this.navigationService.back();
  }

  import() {
    if (this.chosencurrency === undefined) {
      this.notification.show('Please choose coin');
    } else {
      const overalyRef = this.navigationService.pushOverlay(SendTransactionComponent);
      overalyRef.instance.currency = this.chosencurrency;
      overalyRef.instance.fixedaddress = this.project.address;
    }
  }

  whitelist() {
    const overalyRef = this.navigationService.pushOverlay(WhitelistComponent);
    overalyRef.instance.project = this.project;
  }

  investments(investor: boolean) {
    const overalyRef = this.navigationService.pushOverlay(InvestmentsComponent);
    overalyRef.instance.project = this.project;
    overalyRef.instance.investor = investor;
  }

  async reminder() {
    console.log('DO SOME SHIT');
  }

  changeCurrency(coin) {
    console.log(coin, this);
    coin.chosen = !coin.chosen;
    this.coins.forEach((item) => {
      if (item.coin === this.chosencurrency)
        item.chosen = false;
    });
    this.chosencurrency = (coin.chosen)?coin.coin:undefined;
  }

  async loadDescription() {
    const description = await this.ipfsService.get(this.ipfsCid + '/description');
    if (description && description.length > 0) {
      this.project.description = description[0].content.toString('utf8');
    }
  }

  async loadLogo() {
    const logo = await this.ipfsService.get(this.ipfsCid + '/logo');
    if (logo && logo.length > 0) {
      this.project.logo = "data:image/png;base64," + logo[0].content.toString('base64');
    }
  }

}
