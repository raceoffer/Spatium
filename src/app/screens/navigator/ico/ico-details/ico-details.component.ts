import { Component, HostBinding, Input, OnDestroy, NgZone, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { SendTransactionComponent } from '../../send-transaction/send-transaction.component';
import { InvestmentsComponent } from '../investments/investments.component';
import { NotificationService } from '../../../../services/notification.service';
import { CurrencyService } from '../../../../services/currency.service';
import { NavigationService } from '../../../../services/navigation.service';
import { DeviceService, Platform } from '../../../../services/device.service';

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

  public isWindows;

  constructor(
    private readonly notification: NotificationService,
    private readonly currency: CurrencyService,
    private readonly device: DeviceService,
    private readonly navigationService: NavigationService) {
    this.isWindows = (this.device.platform === Platform.Windows);  
  }

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
}
