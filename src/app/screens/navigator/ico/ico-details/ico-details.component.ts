import { Component, HostBinding, Input } from '@angular/core';
import { WhitelistComponent } from '../whitelist/whitelist.component';
import { InvestmentsComponent } from '../investments/investments.component';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  selector: 'app-ico-details',
  templateUrl: './ico-details.component.html',
  styleUrls: ['./ico-details.component.css'],
})
export class IcoDetailsComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;

  public coin: any = undefined;
  public currency: any = undefined;

  constructor(
    private readonly navigationService: NavigationService
  ) { }

  async onBack() {
    this.navigationService.back();
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

  async changeSel(e) {
    this.currency = e.value;
  }
}
