import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { BluetoothService } from '../../services/bluetooth.service';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService
  ) {}

  public ngOnInit() {
    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        await this.router.navigate(['/waiting']);
      }));
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();

    await this.bt.disconnect();
  }
}
