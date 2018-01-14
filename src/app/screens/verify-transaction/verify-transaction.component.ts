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
export class VerifyTransactionComponent implements AfterViewInit {
  name;
  showTransaction: boolean = true;
  tx;
  entropy;
  address;
  btc;
  rateBtcUsd = 15000;
  usd;

  constructor(private route: ActivatedRoute,
              private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router,
              private ngZone: NgZone) { }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      console.log(params); // {order: "popular"}

      this.name = params.name;
      console.log(this.name); // popular
    });  

    this.wallet.onVerifyTransaction.subscribe(async (event) => {
      this.tx = event.transaction;
      this.entropy = event.entropy;
      this.address = event.address;
      this.btc = bcoin.amount.btc(event.value);
      this.usd = this.btc * this.rateBtcUsd;
      this.showTransaction = true;

      console.log("Transaction:");
      console.log(this.address);
      console.log(this.btc);
      console.log(this.usd);
    });

    this.wallet.resetRemote();
    this.wallet.onStatus.subscribe((status) => {
      console.log(status);
    });
    this.bt.onDisconnected.subscribe(() => {
      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    });
  }

  confirm() {
    console.log("Transaction confirmed");
    this.showTransaction = false;
    this.wallet.accept(this.tx, this.entropy);
  }

  decline() {
    console.log("Transaction declined");
    this.showTransaction = false;
    this.wallet.reject();
  }

}
