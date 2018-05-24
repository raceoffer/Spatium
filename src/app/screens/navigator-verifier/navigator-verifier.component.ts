import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConnectivityService } from '../../services/connectivity.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-navigator-verifier',
  templateUrl: './navigator-verifier.component.html',
  styleUrls: ['./navigator-verifier.component.css']
})
export class NavigatorVerifierComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  constructor(private readonly wallet: WalletService,
              private readonly connectivityService: ConnectivityService) {}

  public async ngOnInit() {
    this.subscriptions.push(
      this.connectivityService.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
        await this.wallet.reset();
      }));

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.connectivityService.disconnect();
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.connectivityService.disconnect();
      }));

    await this.connectivityService.startListening();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.connectivityService.disconnect();
    await this.connectivityService.stopListening();
  }
}
