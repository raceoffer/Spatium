import {AfterViewInit, ChangeDetectorRef, Component, Input} from '@angular/core';
import {WalletService} from '../../services/wallet.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material';

declare const bcoin: any;
declare const window: any;

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.css']
})
export class SendTransactionComponent implements AfterViewInit {
  @Input() addressReceiver = 'n3bizXy1mhAkAEXQ1qoWw1hq8N5LktwPeC';
  selected = '';

  _sendBtc = 0.1;

  rateBtcUsd = 15000;

  get sendBtc() {
    return this._sendBtc;
  }

  @Input()
  set sendBtc(btc) {
    this._sendBtc = btc;
    this.sendUsd = this.sendBtc * this.rateBtcUsd;
  }

  sendUsd = this.sendBtc * this.rateBtcUsd;

  currentTx = null;
  entropy = null;

  walletAddress = '';
  balanceBtcConfirmed = 0;
  balanceBtcUnconfirmed = 0;
  balanceUsd = 0;

  state = 0;
  buttonText = 'Продолжить';

  isSecond = false; // параметр, индикатор инициатора\верификатора

  disableFields = false; // блокировка полей транзакции
  initContinueDisabled = false; // активность кнопки "Продолжить" у инициатора
  initCancelDisabled = false; // Активность кнопки "Отмена" у инициатора

  constructor(private walletService: WalletService,
              private route: ActivatedRoute,
              private router: Router,
              private cd: ChangeDetectorRef,
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
      await this.startAccepting(event.transaction, event.entropy, event.address, event.value);
    });

    this.walletService.onAccepted.subscribe(async () => {
      await this.accepted();
    });

    this.walletService.onRejected.subscribe(async () => {
      await this.rejected();
    });

    this.walletService.onSigned.subscribe(async (signatures) => {
      await this.finalaizeSignature(signatures);
    });
  }

  updataBalance(balance) {
    this.balanceBtcConfirmed = bcoin.amount.btc(balance.confirmed);
    this.balanceBtcUnconfirmed = bcoin.amount.btc(balance.unconfirmed);
    this.balanceUsd = (this.balanceBtcUnconfirmed) * this.rateBtcUsd;
    this.cd.detectChanges();
  }

  stateChange(desiredState): void {
    switch (desiredState) {
      case 0: {
        this.isSecond = false;
        this.state = 0;
        this.disableFields = false;
        this.initContinueDisabled = false;
        this.initCancelDisabled = true;

        break;
      }
      case 1: {
        this.state = 1;
        this.disableFields = true;
        this.initContinueDisabled = false;
        this.initCancelDisabled = false;

        break;
      }
      case 2: {
        this.state = 2;
        this.disableFields = true;
        this.initContinueDisabled = true;
        this.initCancelDisabled = true;

        break;
      }
      case 3: {
        this.state = 3;
        this.disableFields = true;
        this.initContinueDisabled = false;
        this.initCancelDisabled = false;

        break;
      }
    }
  }

  async sendTransaction() {
    this.stateChange(0);
    this.cd.detectChanges();

    try {
      await this.walletService.verifySignature(this.currentTx);
      await this.walletService.pushTransaction(this.currentTx);

      window.plugins.toast.showLongBottom('Транзакция была отправлена.', 3000, 'Транзакция была отправлена.',
        console.log('Транзакция была отправлена.'));
    } catch (e) {
      window.plugins.toast.showLongBottom('He удалось отправить транзакцию.', 3000, 'He удалось отправить транзакцию.',
        console.log('He удалось отправить транзакцию.'));
    }
  }

  async cancelTransaction() {
    this.stateChange(0);
    this.cd.detectChanges();
    await this.walletService.reject();
  }

  // Received signature should ask for confirmation
  async startAccepting(tx, entropy, address, value) {
    this.currentTx = tx;
    this.entropy = entropy;

    console.log(address, value);

    this.addressReceiver = address;
    this.sendBtc = bcoin.amount.btc(value);
    this.sendUsd = this.sendBtc * this.rateBtcUsd;

    this.isSecond = true;
    this.stateChange(1);
    this.cd.detectChanges();
  }

  async accept() {
    this.stateChange(2);
    this.cd.detectChanges();
    await this.walletService.accept(this.currentTx, this.entropy);
  }

  async skip() {
    this.stateChange(0);
    this.cd.detectChanges();
  }

  // Pressed start signeture
  async startSigning() {
    this.currentTx = await this.walletService.createTransaction(this.addressReceiver, bcoin.amount.fromBTC(this.sendBtc).value, false);
    if (this.currentTx) {
      this.isSecond = false;
      this.stateChange(1);
      this.cd.detectChanges();
      await this.walletService.startVerify(this.currentTx, this.addressReceiver, bcoin.amount.fromBTC(this.sendBtc).value);
    }
  }

  // Received confirmation
  async accepted() {
    if (this.state === 0) {
      return;
    }

    this.stateChange(2);
    this.cd.detectChanges();
  }

  // Received rejection
  async rejected() {
    this.stateChange(0);
    this.cd.detectChanges();
  }

  // Received a ready signature
  async finalaizeSignature(signatures) {
    if (this.state === 0) {
      return;
    }

    this.stateChange(3);
    this.cd.detectChanges();

    this.currentTx.injectSignatures(signatures);

    const ok = await this.walletService.verifySignature(this.currentTx);

    if (!ok && !this.isSecond) {
      window.plugins.toast.showLongBottom('Транзакция некорректна', 3000, 'Транзакция некорректна', console.log('Транзакция некорректна'));
    }
  }
}

