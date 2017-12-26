import { Component, OnInit } from '@angular/core';
import WalletData from '../../classes/wallet-data';
import {WalletService} from '../../services/wallet.service';
import {FormControl, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";

declare var bcoin: any;
declare var CompoundKey: any;
declare var WatchingWallet: any;

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.css']
})
export class SendTransactionComponent implements OnInit {
  initiatorWallet: WalletData;
  load = true;

  balanceBtc = 100;
  balanceUsd = 7000;
  addressReceiver = 'ksjasi788399032usdk';
  sendBtc = 0.1;
  sendUsd = 7;
  course = 70;

  state = 0;
  buttonText = 'Продолжить';

  isSecond = false;

  constructor(private walletService: WalletService,
              private route: ActivatedRoute,
              private router: Router) {}

  async ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params);

        this.isSecond = params.isSecond;
        console.log(this.isSecond);
      });

    await this.walletService.emulateConnection();
    this.initiatorWallet = await this.walletService.getWallet();
    this.load = !this.load;
  }

  changeSum(type) : void{
    console.log('type' + type);
    if (type === 'btc'){
      this.sendUsd = this.sendBtc * this.course;
    } else {
      this.sendBtc = this.sendUsd / this.course;
    }
  }

  stateChange() : void {
    switch (this.state){
      case 0: {
        this.state = 1;
        this.buttonText = 'Отмена';
        break;
      }
    }
  }
}

