import {Component, OnInit, AfterViewInit, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';
import {WalletService} from '../../services/wallet.service';
import {MatFormFieldModule, MatInputModule} from '@angular/material';

declare const bcoin: any;

@Component({
  selector: 'app-connect',
  templateUrl: './verify-transaction.component.html',
  styleUrls: ['./verify-transaction.component.css']
})
export class VerifyTransactionComponent implements AfterViewInit, OnInit {
  name;
  showTransaction = false;
  tx;
  entropy;
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
              private router: Router,
              private ngZone: NgZone) { }

  ngOnInit() {
    this.wallet.resetRemote();
    this.bt.disconnect();
    this.wallet.onFinish.subscribe(async () => await this.ngZone.run(async () => {
      console.log(this.wallet.address);
      this.ready = true;
      this.synching = false;
    }));
    this.bt.onConnected.subscribe( async () => await this.ngZone.run(async () => {
      await this.wallet.startSync();
      this.synching = true;
      this.ready = false;
    }));
    this.bt.onDisconnected.subscribe(async () => await this.ngZone.run(async () => {
      this.wallet.resetRemote();
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
      console.log(params); // {order: "popular"}

      this.name = params.name;
      console.log(this.name); // popular
    });

    this.wallet.onVerifyTransaction.subscribe(async (event) => await this.ngZone.run(async () => {
      this.tx = event.transaction;
      this.entropy = event.entropy;
      this.address = event.address;
      this.btc = bcoin.amount.btc(event.value);
      this.usd = this.btc * this.rateBtcUsd;
      this.showTransaction = true;

      console.log('Transaction:');
      console.log(this.address);
      console.log(this.btc);
      console.log(this.usd);
    }));

    this.wallet.resetRemote();
    this.wallet.onStatus.subscribe((status) => {
      console.log(status);
    });

    await this.changeBtState();
  }

  confirm() {
    console.log('Transaction confirmed');
    this.showTransaction = false;
    this.wallet.accept(this.tx, this.entropy);
  }

  decline() {
    console.log('Transaction declined');
    this.showTransaction = false;
    this.wallet.reject();
  }

  async changeBtState() {
    this.disabledBT = !await this.bt.ensureEnabled();
    await this.bt.ensureListening();
  }
}
