import {Component, OnInit, OnDestroy, HostBinding, Input} from '@angular/core';

import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiServer, CurrencyInfoService, CurrencyInfo, CurrencyId } from '../../../services/currencyinfo.service';

@Component({
  selector: 'app-currency-settings',
  templateUrl: './currency-settings.component.html',
  styleUrls: ['./currency-settings.component.css']
})
export class CurrencySettingsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public currencyId: CurrencyId = null;

  public currencyInfo: CurrencyInfo = null;
  // public currencySettings: CurrencySettings = new CurrencySettings();
  public apiServers: Map<ApiServer, string> = null;

  public customApiServerInvalid = false;

  private subscriptions = [];

  constructor(
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly navigationService: NavigationService,
    private readonly notificationService: NotificationService
  ) { }

  async ngOnInit() {
    this.apiServers = await this.currencyInfoService.apiServers(this.currencyId);
    this.currencyInfo = await this.currencyInfoService.currencyInfo(this.currencyId);
    //  this.currencySettings = await this.currencyService.getSettings(this.currencyId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  getApiServerKeys() {
    if (this.apiServers == null) {
      return [];
    }
    return Array.from(this.apiServers.keys());
  }

  async onSaveClicked() {
    // if (this.currencySettings.serverName === ApiServer.Custom && !this.isValidServerUrl(this.currencySettings.serverUrl)) {
    //   this.customApiServerInvalid = true;
    //   return;
    // }

    // await this.currencyService.saveSettings(this.currency, this.currencySettings);
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
