import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  constructor(private readonly wallet: WalletService,
              private readonly router: Router,
              private readonly bt: BluetoothService) {}

  public ngOnInit() {

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        console.log(new Date());
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.wallet.resyncEvent.subscribe(async () => {
        await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
      }));

    this.subscriptions.push(
      this.wallet.cancelResyncEvent.subscribe(async () => {
        this.bt.disconnect();
      }));

  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.wallet.resetSession();
    await this.bt.disconnect();
  }
}
