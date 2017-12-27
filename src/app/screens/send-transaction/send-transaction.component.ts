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

  loading: boolean = true;
  connectedDevice = 'Xperia';

  addressReceiver = 'ksjasi788399032usdk';
  sendBtc = 0.1;
  sendUsd = 7;

  rateBtcUsd = 15000;

  walletAddress = '';
  balanceBtcConfirmed = 0;
  balanceBtcUnconfirmed = 0;
  balanceUsd = 0;

  state = 0;
  buttonText = 'Продолжить';

  isSecond = false; // параметр, индикатор инициатора\верификатора

  progressCreateTransaction = 40;
  disableFields = false; // блокировка полей транзакции
  initContinueDisabled = false; // активность кнопки "Продолжить" у инициатора
  initCancelDisabled = false; // Активность кнопки "Отмена" у инициатора

  constructor(private walletService: WalletService,
              private route: ActivatedRoute,
              private router: Router,
              public snackBar: MatSnackBar) {}

  ngAfterViewInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params);

        this.isSecond = params.isSecond;
        if (this.isSecond) {
          this.state = 1;
          this.disableFields = true;
        }

        console.log(this.isSecond);
      });

    this.walletAddress = this.walletService.getAddress();
    this.updataBalance(this.walletService.getBalance());
    this.walletService.onBalance.subscribe((balance) => {
      this.updataBalance(balance);
    });

   this.loading = !this.loading;
  }

  updataBalance(balance) {
    this.balanceBtcConfirmed = bcoin.amount.btc(balance.confirmed);
    this.balanceBtcUnconfirmed = bcoin.amount.btc(balance.unconfirmed);
    this.balanceUsd = (this.balanceBtcUnconfirmed) * this.rateBtcUsd;
  }

  changeSum(type): void {
    console.log('type' + type);
    if (type === 'btc') {
      this.sendUsd = this.sendBtc * this.rateBtcUsd;
    } else {
      this.sendBtc = this.sendUsd / this.rateBtcUsd;
}
  }

  stateChange(): void {
    switch (this.state){
      case 0: {//экрвн ожидания
        this.state = 1; // ожидание подтверждения узла
        this.disableFields = true;
        this.initContinueDisabled = true;

        break;
      }
      case 1: {
        this.state = 2; // подписание транзакции
        this.initContinueDisabled = true;
        this.initCancelDisabled = true;

        break;
      }
      case 2: {
        this.state = 3; // отправка в сеть
        this.initCancelDisabled = false;

        break;
      }
    }
  }

  sendTransaction(): void {
    this.snackBar.open('Транзакция была отправлена.', null, {
      duration: 3000,
    });
    this.state = 0;
    this.disableFields = false;
    this.initCancelDisabled = false;
    this.initContinueDisabled = false;
  }

  cancelTransaction(): void {
    this.state = 0;
    this.disableFields = false;
    this.initCancelDisabled = false;
    this.initContinueDisabled = false;
  }
}

