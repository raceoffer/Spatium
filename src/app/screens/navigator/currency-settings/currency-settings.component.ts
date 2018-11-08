import {Component, OnInit, OnDestroy, HostBinding, Input, Output, EventEmitter} from '@angular/core';

import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiServer, CurrencyInfoService, CurrencyInfo, CurrencyId } from '../../../services/currencyinfo.service';
import { SettingsService } from '../../../services/settings.service';
import { AnalyticsService, View } from '../../../services/analytics.service';

@Component({
  selector: 'app-currency-settings',
  templateUrl: './currency-settings.component.html',
  styleUrls: ['./currency-settings.component.scss']
})
export class CurrencySettingsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public currencyId: CurrencyId = null;
  @Output() public saved = new EventEmitter<any>();

  public apiServerType = ApiServer;

  public currencyInfo: CurrencyInfo = null;
  public apiServers: Array<{ key: ApiServer, value: string }> = null;
  public settings: { apiServer: ApiServer, customApiServer: string } = null;

  public customApiServerInvalid = false;

  private subscriptions = [];

  constructor(
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly navigationService: NavigationService,
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async ngOnInit() {
    this.analyticsService.trackView(View.CurrencySettings);

    this.apiServers =
      Array.from(await this.currencyInfoService.apiServers(this.currencyId).keys())
        .map((apiServer) => ({ key: apiServer, value: this.currencyInfoService.apiName(apiServer) }));
    this.currencyInfo = await this.currencyInfoService.currencyInfo(this.currencyId);
    this.settings = await this.currencyInfoService.currentApiSettings(this.currencyId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onSaveClicked() {
    if (this.settings.apiServer === ApiServer.Custom && !this.isValidServerUrl(this.settings.customApiServer)) {
      this.customApiServerInvalid = true;
      return;
    }

    await this.settingsService.setCurrencySettings(this.currencyId, this.settings);

    await this.notificationService.show('The settings are saved. Restart the application to apply settings.');

    this.saved.next();
  }

  isValidServerUrl(url: string): boolean {
    try {
      const ignored = new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  async onBack() {
    this.navigationService.back();
  }
}
