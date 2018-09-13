import {Component, OnInit, OnDestroy, HostBinding, Input} from '@angular/core';

import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiServer, CurrencyInfoService, CurrencyInfo, CurrencyId } from '../../../services/currencyinfo.service';
import { SettingsService } from '../../../services/settings.service';
import { AotCompiler } from '@angular/compiler';

@Component({
  selector: 'app-currency-settings',
  templateUrl: './currency-settings.component.html',
  styleUrls: ['./currency-settings.component.css']
})
export class CurrencySettingsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public currencyId: CurrencyId = null;

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
    private readonly settingsService: SettingsService
  ) {}

  async ngOnInit() {
    this.apiServers =
      Array.from(await this.currencyInfoService.apiServers(this.currencyId).keys())
        .map((apiServer) => ({ key: apiServer, value: this.currencyInfoService.apiName(apiServer) }));
    this.currencyInfo = await this.currencyInfoService.currencyInfo(this.currencyId);
    this.settings = await this.settingsService.currencySettings(this.currencyId, {
      apiServer: ApiServer.Spatium
    }) as {
      apiServer: ApiServer,
      customApiServer: string
    };
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
    await this.onBack();
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
