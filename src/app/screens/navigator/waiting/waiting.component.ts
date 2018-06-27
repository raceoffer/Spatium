import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { ConnectionProviderService, Provider } from '../../../services/connection-provider';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';

declare const navigator: any;

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public stLabel = 'Connect to a device';

  public discovering = this.connectionProviderService.discovering;
  public connected = this.connectionProviderService.connected;
  public devices = this.connectionProviderService.combinedDevices;
  public providers = this.connectionProviderService.providers;
  public providersArray = Array.from(this.connectionProviderService.providers.values());
  public ready = this.wallet.ready;

  private subscriptions = [];

  constructor(public dialog: MatDialog,
              private readonly router: Router,
              private readonly wallet: WalletService,
              private readonly navigationService: NavigationService,
              private readonly connectionProviderService: ConnectionProviderService) { }

  async ngOnInit() {

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.connectionProviderService.connectedEvent.subscribe(async () => {
        this.wallet.startSync();
        await this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
      }));

    this.providersArray.forEach((provider) => {
      this.subscriptions.push(
        provider.service.enabledEvent.subscribe(() => {
          provider.service.searchDevices(5 * 1000);
        }));
    });

    await this.connectionProviderService.searchDevices();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async connectTo(device) {
    if (this.ready.getValue()) {
      await this.openDialog(device);
    } else {
      await this.connectionProviderService.connect(device);
    }
  }

  async startDiscovery() {
    await this.connectionProviderService.searchDevices();
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
  }

  async cancelConnect() {
    await this.openDialog(null);
  }

  async openDialog(device) {
    navigator.notification.confirm(
      'Cancel synchronization',
      buttonIndex => {
        if (buttonIndex === 1) { // yes
          this.connectionProviderService.disconnect();

          if (device != null) {
            this.connectionProviderService.connect(device);
          }
        }
      },
      '',
      ['YES', 'NO']
    );
  }

  async toggleProvider(provider: Provider) {
    await this.connectionProviderService.toggleProvider(provider.provider);
  }

  hasDisabled() {
    const temp = this.providersArray.filter(p => !p.service.enabled.getValue());
    if (temp.length > 0) {
      return true;
    }

    return false;
  }
}
