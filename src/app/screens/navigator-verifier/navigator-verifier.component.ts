import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConnectionProviderService } from '../../services/connection-provider';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-navigator-verifier',
  templateUrl: './navigator-verifier.component.html',
  styleUrls: ['./navigator-verifier.component.css']
})
export class NavigatorVerifierComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  constructor(private readonly wallet: WalletService,
              private readonly connectionProviderService: ConnectionProviderService) {}

  public async ngOnInit() {
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

    await this.connectionProviderService.startListening();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.connectionProviderService.disconnect();
    await this.connectionProviderService.stopListening();
  }
}
