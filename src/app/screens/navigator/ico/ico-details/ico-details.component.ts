import { Component, HostBinding, Input, OnDestroy, NgZone, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { SendTransactionComponent } from '../../send-transaction/send-transaction.component';
import { InvestmentsComponent } from '../investments/investments.component';
import { NotificationService } from '../../../../services/notification.service';
import { CurrencyService } from '../../../../services/currency.service';
import { NavigationService } from '../../../../services/navigation.service';
import { ICOService, IcoCampaign } from '../../../../services/ico.service';

import { BehaviorSubject,  Observable, timer } from 'rxjs';

@Component({
  selector: 'app-ico-details',
  templateUrl: './ico-details.component.html',
  styleUrls: ['./ico-details.component.css'],
})
export class IcoDetailsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;
  public coin: any = undefined;
  public chosencurrency: any = undefined;
  public coins: any = [];
  public campaign: BehaviorSubject<IcoCampaign> = new BehaviorSubject<IcoCampaign>(null);

  constructor(
    private readonly icoService: ICOService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly currency: CurrencyService
  ) {
    console.log("details");
    //console.log(this.project);
  }

  async ngOnInit() {
    let campaign = await this.icoService.getCampaign(this.project.address);
    campaign.address = this.project.address;
    campaign.title = this.project.title;
    this.campaign.next(campaign);
  }

  ngOnDestroy() {

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

  changeCurrency(coin) {
    console.log(coin, this);
    coin.chosen = !coin.chosen;
    this.coins.forEach((item) => {
      if (item.coin === this.chosencurrency)
        item.chosen = false;
    });
    this.chosencurrency = (coin.chosen)?coin.coin:undefined;
  }
}
