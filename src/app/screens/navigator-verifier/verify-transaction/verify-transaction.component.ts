import {Component, OnInit, AfterViewInit, OnDestroy, NgZone} from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';
import { WalletService } from '../../../services/wallet.service';
import {Router} from '@angular/router';

declare const bcoin: any;

@Component({
  selector: 'app-verify-transaction',
  templateUrl: './verify-transaction.component.html',
  styleUrls: ['./verify-transaction.component.css']
})
export class VerifyTransactionComponent implements OnInit, AfterViewInit, OnDestroy {
  showTransaction = false;

  address = '';
  btc;
  rateBtcUsd = 15000;
  usd;

  enableBTmessage = 'Enable Bluetooth to proceed';

  enabled = this.bt.enabled;
  discoverable = this.bt.discoverable;
  synchronizing = this.wallet.synchronizing;

  subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly bt: BluetoothService,
    private readonly wallet: WalletService
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.wallet.rejectedEvent.subscribe(async () => {
        this.showTransaction = false;
      }));

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.bt.disconnect();
        this.ngZone.run(async () => {
          await this.router.navigate(['/verify-waiting']);
        });
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.bt.disconnect();
        this.ngZone.run(async () => {
          await this.router.navigate(['/verify-waiting']);
        });
      }));

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.reset();
        this.ngZone.run(async () => {
          await this.router.navigate(['/verify-waiting']);
        });
      }));

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        console.log('Connected to', this.bt.connectedDevice.getValue());
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        await this.wallet.reset();
        this.ngZone.run(async () => {
          await this.router.navigate(['/verify-waiting']);
        });
      }));

    this.subscriptions.push(
      this.wallet.verifyEvent.subscribe((transaction) => {
        const output = transaction.totalOutputs()[0];

        this.address = output.address;
        this.btc = bcoin.amount.btc(output.value);
        this.usd = this.btc * this.rateBtcUsd;
        this.showTransaction = true;

        console.log('Transaction:');
        console.log(this.address);
        console.log(this.btc);
        console.log(this.usd);
      }));

    console.log('Entered verify');
  }

  async ngOnDestroy() {
    console.log('Left verify');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async ngAfterViewInit() { }

  async confirm() {
    this.showTransaction = false;
    await this.wallet.acceptTransaction();
  }

  async decline() {
    this.showTransaction = false;
    await this.wallet.rejectTransaction();
  }

}
