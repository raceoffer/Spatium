import {Component, OnInit, AfterViewInit, OnDestroy, NgZone} from '@angular/core';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';
import {Router} from '@angular/router';

declare const bcoin: any;

@Component({
  selector: 'app-verify-waiting',
  templateUrl: './verify-waiting.component.html',
  styleUrls: ['./verify-waiting.component.css']
})
export class VerifyWaitingComponent  implements OnInit, AfterViewInit, OnDestroy {
  address = '';
  btc;
  rateBtcUsd = 15000;
  usd;

  enableBTmessage = 'Enable Bluetooth to proceed';

  enabled = this.bt.enabled;
  discoverable = this.bt.discoverable;
  synchronizing = this.wallet.synchronizing;
  ready = this.wallet.ready;

  subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly bt: BluetoothService,
    private readonly wallet: WalletService
  ) { }

  async ngOnInit() {
    await this.bt.disconnect();

    this.subscriptions.push(
      this.wallet.readyEvent.subscribe(async () =>  {
        console.log(this.wallet.address.getValue());
        this.ngZone.run(async () => {
          await this.router.navigate(['/navigator-verifier']);
        });
      }));

    this.subscriptions.push(
      this.wallet.cancelledEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.wallet.failedEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.bt.enabledEvent.subscribe(async () => {
        await this.bt.ensureListening();
      }));

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.reset();
      }));

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        console.log('Connected to', this.bt.connectedDevice.getValue());
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        console.log('Disconnected');
        await this.wallet.reset();
        await this.bt.ensureListening();
      }));


    console.log('Entered waiting verify');
  }

  async ngOnDestroy() {
    console.log('Left verify');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async ngAfterViewInit() {
    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.ensureListening();
    }
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async enableDiscoverable() {
    await this.bt.enableDiscovery();
  }
}
