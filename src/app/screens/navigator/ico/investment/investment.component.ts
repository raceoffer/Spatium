import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { SendTransactionComponent } from '../../send-transaction/send-transaction.component';
import { TransactionsComponent } from '../transactions/transactions.component';
import { NotificationService } from '../../../../services/notification.service';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  selector: 'app-investment',
  templateUrl: './investment.component.html',
  styleUrls: ['./investment.component.css'],
})
export class InvestmentComponent implements OnInit, OnDestroy {
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

  transactions() {
    const overalyRef = this.navigationService.pushOverlay(TransactionsComponent);
    overalyRef.instance.project = this.project;
  }

  async reminder() {
    console.log('DO SOME SHIT');
  }

  async changeSel(e) {
    this.currency = e.value;
  }
}
