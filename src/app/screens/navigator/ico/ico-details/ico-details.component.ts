import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { SendTransactionComponent } from '../../send-transaction/send-transaction.component';
import { InvestmentsComponent } from '../investments/investments.component';
import { NotificationService } from '../../../../services/notification.service';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  selector: 'app-ico-details',
  templateUrl: './ico-details.component.html',
  styleUrls: ['./ico-details.component.css'],
})
export class IcoDetailsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;
  public coin: any = undefined;
  public currency: any = undefined;

  constructor(private readonly notification: NotificationService,
              private readonly navigationService: NavigationService) { }

  ngOnInit() {
    
  }

  ngOnDestroy() {

  }

  async onBack() {
    this.navigationService.back();
  }

  import() {
    if (this.currency === undefined) {
      this.notification.show('Please choose coin');
    } else {
      const overalyRef = this.navigationService.pushOverlay(SendTransactionComponent);
      overalyRef.instance.currency = this.currency;
      overalyRef.instance.receiverField.setValue(this.project.address, {emitEvent: false});
      overalyRef.instance.receiverField.disable();
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

  async changeSel(e) {
    this.currency = e.value;
  }
}
