import { Component, HostBinding, Input, NgZone, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { SendTransactionComponent } from '../../send-transaction/send-transaction.component';
import { InvestmentsComponent } from '../investments/investments.component';
import { NotificationService } from '../../../../services/notification.service';
import { CurrencyService } from '../../../../services/currency.service';
import { NavigationService } from '../../../../services/navigation.service';
import { DeviceService, Platform } from '../../../../services/device.service';
import { ICOService, IcoCampaign } from '../../../../services/ico.service';
import { IpfsService, File } from '../../../../services/ipfs.service';

import { BehaviorSubject,  Observable, timer } from 'rxjs';

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
  public campaign: BehaviorSubject<IcoCampaign> = new BehaviorSubject<IcoCampaign>(null);

  public isWindows;

  constructor(
    private readonly icoService: ICOService,
    private readonly notification: NotificationService,
    private readonly ipfsService: IpfsService,
    private readonly device: DeviceService,
    private readonly navigationService: NavigationService) {
    this.isWindows = (this.device.platform === Platform.Windows);  
  }

  async ngOnInit() {
    let campaign = await this.icoService.getCampaign(this.project.address);
    campaign.address = this.project.address;
    campaign.title = this.project.title;
    this.campaign.next(campaign);
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

  }

  async deleteCampaign() {
    let result = await this.icoService.removeCampaign(this.project.address);
    this.navigationService.acceptOverlay();
    console.log(result);
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
    const description = await this.ipfsService.get(this.campaign.value.ipfsFolder + '/description');
    if (description && description.length > 0) {
      this.project.description = description[0].content.toString('utf8');
    }
  }

  async loadLogo() {
    const logo = await this.ipfsService.get(this.campaign.value.ipfsFolder + '/logo');
    if (logo && logo.length > 0) {
      this.project.logo = "data:image/png;base64," + logo[0].content.toString('base64');
    }
  }

}
