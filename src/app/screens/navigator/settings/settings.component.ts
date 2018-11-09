import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FactorNodeComponent } from '../factor-node/factor-node.component';
import { AnalyticsService, View } from '../../../services/analytics.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() cancelled = new EventEmitter<any>();

  navLinks = [{
    name: 'Add authorization path',
    link: 'factornode'
  }, {
    name: 'Language',
    link: 'lang',
  }];

  constructor(
    private readonly navigationService: NavigationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  ngOnInit() {
    this.analyticsService.trackView(View.SettingsWalletMode);
  }

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  onSelected(navLink) {
    if (navLink.link === 'factornode') {
      const componentRef = this.navigationService.pushOverlay(FactorNodeComponent);
    }
  }
}
