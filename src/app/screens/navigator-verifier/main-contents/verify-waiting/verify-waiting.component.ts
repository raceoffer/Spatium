import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConnectionProviderService, Provider } from '../../../../services/connection-provider';
import { NavigationService } from '../../../../services/navigation.service';
import { NotificationService } from '../../../../services/notification.service';
import { WalletService } from '../../../../services/wallet.service';

@Component({
  selector: 'app-verify-waiting',
  templateUrl: './verify-waiting.component.html',
  styleUrls: ['./verify-waiting.component.css']
})
export class VerifyWaitingComponent implements OnInit, OnDestroy {
  public ready = this.connectionProviderService.listening;

  public isExitTap = false;
  providers = Array.from(this.connectionProviderService.providers.values());
  private subscriptions = [];

  constructor(private readonly connectionProviderService: ConnectionProviderService,
              private readonly navigationService: NavigationService,
              private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly notification: NotificationService,
              private readonly wallet: WalletService) {
    this.connectionProviderService.setConfMode();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.connectionProviderService.connectedEvent.subscribe(async () => {
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.connectionProviderService.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    if (this.isExitTap) {
      this.notification.hide();
      await this.router.navigate(['/start']);
    } else {
      this.notification.show('Tap again to exit');
      this.isExitTap = true;
      setTimeout(() => this.ngZone.run(() => {
        this.isExitTap = false;
      }), 3000);
    }
  }

  async toggleProvider(provider: Provider, event) {
    console.log('toggle');

    event.source.disabled = ((((provider.service.starting.getValue()) || (provider.service.stopping.getValue()) || (provider.service.awaitingEnable.getValue())))
      && !(provider.service.listening.getValue()));
    event.source.checked = ((provider.service.listening.getValue()) || (provider.service.starting.getValue()));
    event.checked = event.source.checked;

    await this.connectionProviderService.toggleProvider(provider.provider);
  }


  async enableDiscovery(provider: Provider) {
    await this.connectionProviderService.enableDiscovery(provider.provider);
  }
}
