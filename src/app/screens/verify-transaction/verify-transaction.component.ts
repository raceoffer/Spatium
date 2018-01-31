import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';

declare const bcoin: any;

@Component({
  selector: 'app-verify-transaction',
  templateUrl: './verify-transaction.component.html',
  styleUrls: ['./verify-transaction.component.css']
})
export class VerifyTransactionComponent implements AfterViewInit, OnInit {
  name;
  showTransaction = false;
  address;
  btc;
  rateBtcUsd = 15000;
  usd;

  enableBTmessage = 'Enable Bluetooth to proceed';
  enabled = this.bt.enabled;
  discoverable = this.bt.discoverable;

  synchronizing = this.wallet.synchronizing;
  ready = this.wallet.ready;

  constructor(private route: ActivatedRoute,
              private bt: BluetoothService,
              private wallet: WalletService,
              private ngZone: NgZone) { }

  async ngOnInit() {
    await this.bt.disconnect();
    this.wallet.readyEvent.subscribe(() => this.ngZone.run(async () => {
      console.log(this.wallet.address.getValue());
    }));
    this.wallet.cancelledEvent.subscribe(async () => {
      await this.bt.disconnect();
    });
    this.wallet.failedEvent.subscribe(async () => {
      await this.bt.disconnect();
    });
    this.bt.enabledEvent.subscribe(() => this.ngZone.run(async () => {
      await this.bt.ensureListening();
    }));
    this.bt.disabledEvent.subscribe(() => this.ngZone.run(async () => {
      await this.wallet.cancelSync();
    }));
    this.bt.connectedEvent.subscribe(() => this.ngZone.run(async () => {
      console.log('Connected to', this.bt.connectedDevice.getValue());
      await this.wallet.startSync();
    }));
    this.bt.disconnectedEvent.subscribe(() => this.ngZone.run(async () => {
      console.log('Disconnected');
      await this.wallet.cancelSync();
    }));
  }

  async ngAfterViewInit() {
    this.showTransaction = false;

    this.route.queryParams.subscribe(params => {
      this.name = params.name;
    });

    this.wallet.onVerifyTransaction.subscribe((event) => this.ngZone.run(async () => {
      this.address = event.address;
      this.btc = bcoin.amount.btc(event.value);
      this.usd = this.btc * this.rateBtcUsd;
      this.showTransaction = true;

      console.log('Transaction:');
      console.log(this.address);
      console.log(this.btc);
      console.log(this.usd);
    }));

    if (!this.bt.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.ensureListening();
    }
  }

  async confirm() {
    console.log('Transaction confirmed');
    this.showTransaction = false;
    await this.wallet.acceptTransaction();
  }

  async decline() {
    console.log('Transaction declined');
    this.showTransaction = false;
    await this.wallet.rejectTransaction();
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async enableDiscoverable() {
    await this.bt.enableDiscovery();
  }
}
