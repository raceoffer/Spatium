import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { BluetoothService } from '../../services/bluetooth.service';

@Component({
  selector: 'app-navigator-verifier',
  templateUrl: './navigator-verifier.component.html',
  styleUrls: ['./navigator-verifier.component.css']
})
export class NavigatorVerifierComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService
  ) {}

  public ngOnInit() {

  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.bt.disconnect();
  }
}
