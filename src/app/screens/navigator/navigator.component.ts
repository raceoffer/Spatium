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
              private readonly bt: BluetoothService) {}

  public ngOnInit() {

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
         await this.wallet.changeStatus();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        await this.wallet.cancelSync();
      }));

  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.bt.disconnect();
  }
}
