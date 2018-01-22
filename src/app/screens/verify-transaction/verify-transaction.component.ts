import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';

declare const bcoin: any;

@Component({
  selector: 'app-connect',
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

  enableBTmessage = 'Turn on Bluetooth to proceed';
  Label = 'Device paring';
  disabledBT = true;

  synching = false;
  ready = false;

  constructor(private route: ActivatedRoute,
              private bt: BluetoothService,
              private wallet: WalletService,
              private ngZone: NgZone) { }

  async ngOnInit() {
    await this.bt.disconnect();
    this.wallet.onFinish.subscribe(() => this.ngZone.run(async () => {
      console.log(this.wallet.address.getValue());
      this.ready = true;
      this.synching = false;
    }));
    this.wallet.onCancelled.subscribe(async () => {
      await this.bt.disconnect();
      this.synching = false;
      this.ready = false;
    });
    this.wallet.onFailed.subscribe(async () => {
      await this.bt.disconnect();
      this.synching = false;
      this.ready = false;
    });
    this.bt.onConnected.subscribe(() => this.ngZone.run(async () => {
      await this.wallet.startSync();
      this.synching = true;
      this.ready = false;
    }));
    this.bt.onDisconnected.subscribe(() => this.ngZone.run(async () => {
      this.synching = false;
      this.ready = false;

      await this.changeBtState();
    }));
  }

  async ngAfterViewInit() {
    this.synching = false;
    this.ready = false;
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

    await this.changeBtState();
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

  async changeBtState() {
    this.disabledBT = !await this.bt.ensureEnabled();
    await this.bt.ensureListening();
  }
}
