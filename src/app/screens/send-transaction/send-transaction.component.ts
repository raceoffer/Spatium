import {AfterViewInit, Component} from '@angular/core';
import WalletData from '../../classes/wallet-data';
import {WalletService} from '../../services/wallet.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material';
import {BluetoothService} from '../../services/bluetooth.service';

declare const bcoin: any;

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.css']
})
export class SendTransactionComponent implements AfterViewInit {
  addressReceiver = 'n3bizXy1mhAkAEXQ1qoWw1hq8N5LktwPeC';
  selected = '';
  sendBtc = 0.1;
  sendUsd = 7;

  rateBtcUsd = 15000;

  currentTx = null;

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
              private bt: BluetoothService,
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
    this.selected = this.walletAddress;
    this.updataBalance(this.walletService.getBalance());
    this.walletService.onBalance.subscribe((balance) => {
      this.updataBalance(balance);
    });

    this.walletService.onVerifyTransaction.subscribe(async (event) => {
      await this.startAccepting(event.transaction, event.entropy);
    });

    this.walletService.onAccepted.subscribe(async () => {
      await this.accepted();
    });

    this.walletService.onSigned.subscribe(async (signatures) => {
      await this.finalaizeSignature(signatures);
    });
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
    switch (this.state) {
      case 0: { // экрвн ожидания
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

  async sendTransaction() {
    this.state = 0;
    this.disableFields = false;
    this.initCancelDisabled = false;
    this.initContinueDisabled = false;

    try {
      await this.walletService.verifySignature(this.currentTx);
      await this.walletService.pushTransaction(this.currentTx);

      this.snackBar.open('Транзакция была отправлена.', null, {
        duration: 3000,
      });
    } catch (e) {
      this.snackBar.open('He удалось отправить транзакцию.', null, {
        duration: 3000,
      });
    }
  }

  cancelTransaction(): void {
    this.state = 0;
    this.disableFields = false;
    this.initCancelDisabled = false;
    this.initContinueDisabled = false;
  }

  // Received signature should ask for confirmation
  async startAccepting(tx, entropy) {
    this.currentTx = tx;
    this.isSecond = true;
    this.state = 2;
    this.initContinueDisabled = true;
    this.initCancelDisabled = true;
    console.log(tx.toJSON(), entropy);

    await this.walletService.accept(tx, entropy);
  }

  // Pressed start signeture
  async startSigning() {
    this.currentTx = await this.walletService.createTransaction(this.addressReceiver, 60000000, false);
    if (this.currentTx) {
      await this.walletService.startVerify(this.currentTx);

      this.state = 1;
      this.isSecond = false;
      this.disableFields = true;
      this.initContinueDisabled = true;
    }
  }

  // Received confirmation
  async accepted() {
    // Dunno
  }

  // Received a ready signature
  async finalaizeSignature(signatures) {
    this.state = 3;
    this.initCancelDisabled = false;

    this.currentTx.injectSignatures(signatures);

    const ok = await this.walletService.verifySignature(this.currentTx);

    if (!ok && !this.isSecond) {
      this.snackBar.open('Транзакция некорректна', null, {
        duration: 3000,
      });
    }
  }
}

