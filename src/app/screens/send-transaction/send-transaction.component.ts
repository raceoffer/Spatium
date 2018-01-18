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

  currentWalletPh = 'Wallet';
  receiverPh = 'Recipient';

  stAwaitConfirm = 'Confirm on the second device';
  stSigning = 'Signing transaction';
  stSigningResult = 'Transaction is signed';

  stContinue = 'Continue';
  stCancel = 'Cancel';
  stConfirm = 'Confirm';
  stTransfer = 'Transfer';

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

  walletAddress = '';
  balanceBtcConfirmed = 0;
  balanceBtcUnconfirmed = 0;
  balanceUsd = 0;

  state = 0;
  buttonText = 'Continue';

  isSecond = false; // параметр, индикатор инициатора\верификатора

  disableFields = false; // блокировка полей транзакции
  initContinueDisabled = false; // активность кнопки "Продолжить" у инициатора
  initCancelDisabled = false; // Активность кнопки "Отмена" у инициатора

  constructor(private walletService: WalletService,
              private route: ActivatedRoute,
              private router: Router,
              private cd: ChangeDetectorRef) {}

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

    this.walletService.onAccepted.subscribe(async () => {
      await this.accepted();
    });

    this.walletService.onRejected.subscribe(async () => {
      await this.rejected();
    });

    this.walletService.onSigned.subscribe(async () => {
      await this.finalaized();
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
      // await this.walletService.verifySignature(this.currentTx);
      // await this.walletService.pushTransaction(this.currentTx);

      window.plugins.toast.showLongBottom(
        'The transaction was successfully sent',
        3000,
        'The transaction was successfully sent',
        console.log('The transaction was successfully sent')
      );
    } catch (e) {
      window.plugins.toast.showLongBottom(
        'Error sending transaction',
        3000,
        'Error sending transaction',
        console.log('Error sending transaction')
      );
    }
  }

  async cancelTransaction() {
    this.stateChange(0);
    this.cd.detectChanges();
    await this.walletService.rejectTransaction();
  }

  async skip() {
    this.stateChange(0);
    this.cd.detectChanges();
  }

  // Pressed start signeture
  async startSigning() {
    const tx = await this.walletService.createTransaction(this.addressReceiver, bcoin.amount.fromBTC(this.sendBtc).value, false);
    if (tx) {
      this.isSecond = false;
      this.stateChange(1);
      this.cd.detectChanges();
      await this.walletService.requestTransactionVerify(tx, this.addressReceiver, bcoin.amount.fromBTC(this.sendBtc).value);
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
  async finalaized() {
    if (this.state === 0) {
      return;
    }

    this.stateChange(3);
    this.cd.detectChanges();
  }
}

