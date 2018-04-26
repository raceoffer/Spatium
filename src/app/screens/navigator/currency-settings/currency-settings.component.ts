import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Coin, Token } from '../../../services/keychain.service';
import { CurrencyService, Info, CurrencySettings, CurrencyServerName } from '../../../services/currency.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-currency-settings',
  templateUrl: './currency-settings.component.html',
  styleUrls: ['./currency-settings.component.css']
})
export class CurrencySettingsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;
  public currencySettings : CurrencySettings = new CurrencySettings();
  public apiServers: Map<string, string> = null;

  public customApiServerInvalid = false;

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService,
    private readonly notificationService: NotificationService
    ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
      await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.route.params.subscribe(async (params: Params) => {
      this.currency = Number(params['coin']) as Coin | Token;
      this.apiServers = await this.currencyService.getAvailableApiServers(this.currency);
      this.currencyInfo = await this.currencyService.getInfo(this.currency);
      this.currencySettings = await this.currencyService.getSettings(this.currency);
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  getApiServerKeys(){
    if(this.apiServers == null)
      return [];
    return Array.from(this.apiServers.keys());
  }

  async onSaveClicked() {
    if(this.currencySettings.serverName == CurrencyServerName.Custom && !this.isValidServerUrl(this.currencySettings.serverUrl)) {
      this.customApiServerInvalid = true;
      return;
    }

    await this.currencyService.saveSettings(this.currency, this.currencySettings);
    await this.notificationService.show("Settings saved. Restart the application to apply settings.");
    this.onBackClicked();
  }

  isValidServerUrl(url: string) : boolean {
    try {
      new URL(url);
      return true;
    }
    catch(e) {
      return false;
    }
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['currency', this.currency] } }]);
  }
}
