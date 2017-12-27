import {AfterViewInit, Component} from '@angular/core';
import WalletData from '../../classes/wallet-data';
import {WalletService} from '../../services/wallet.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material';

declare const bcoin: any;

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.css']
})
export class SendTransactionComponent implements AfterViewInit {
  initiatorWallet: WalletData;
  load = true;

  balanceBtc = '100';
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
              private router: Router,
              public snackBar: MatSnackBar) {}

  ngAfterViewInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params);

        this.isSecond = params.isSecond;
        console.log(this.isSecond);
      });

    this.initiatorWallet = this.walletService.getWallet();
    this.addressReceiver = this.walletService.getAddress();
    this.balanceBtc = bcoin.amount.btc(this.walletService.getBalance().confirmed) + '(' + bcoin.amount.btc(this.walletService.getBalance().unconfirmed) + ')';
    this.load = !this.load;
  }

  changeSum(type): void {
    console.log('type' + type);
    if (type === 'btc'){
      this.sendUsd = this.sendBtc * this.course;
    } else {
      this.sendBtc = this.sendUsd / this.course;
}
  }

  stateChange(): void {
    switch (this.state){
      case 0: {
        this.state = 1; // ожидание узла
        this.buttonText = 'Отмена';

        break;
      }
      case 1: {
        this.state = 2; // создание транзакции
        this.buttonText = 'Отмена';

        break;
      }
      case 2: {
        this.state = 3; // отправка в сеть
        this.buttonText = 'Отмена';

        break;
      }
    }
  }

  sendTransaction(): void {
    this.snackBar.open('Транзакция была отправлена.', null, {
      duration: 3000,
    });
    this.state = 0;
    this.buttonText = 'Продолжить';
  }
}

