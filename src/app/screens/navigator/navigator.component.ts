import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConnectionProviderService } from '../../services/connection-provider';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  constructor(private readonly wallet: WalletService,
              private readonly connectionProviderService: ConnectionProviderService) {}

  public ngOnInit() {
    this.subscriptions.push(
      this.connectionProviderService.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
        await this.wallet.reset();
      }));

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.connectionProviderService.disconnect();
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.connectionProviderService.disconnect();
      }));
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.connectionProviderService.disconnect();
  }
}
