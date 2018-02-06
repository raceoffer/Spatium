import { OnInit, Component, OnDestroy } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

declare const bcoin: any;

enum Phase {
  Creation,
  Confirmation,
  Sending
}

@Component({
  selector: 'app-send-transaction',
  templateUrl: './send-transaction.component.html',
  styleUrls: ['./send-transaction.component.css']
})
export class SendTransactionComponent implements OnInit, OnDestroy {
  public phaseType = Phase; // for template

  addressReceiver = 'n3bizXy1mhAkAEXQ1qoWw1hq8N5LktwPeC';

  currentWalletPh = 'Wallet';
  receiverPh = 'Recipient';

  stAwaitConfirm = 'Confirm on the second device';
  stSigningResult = 'Transaction is signed';

  stContinue = 'Continue';
  stCancel = 'Cancel';
  stTransfer = 'Transfer';
  stSend = 'Send';

  selected = '';

  _sendBtc = 0.1;

  rateBtcUsd = 15000;

  get sendBtc() {
    return this._sendBtc;
  }

  set sendBtc(btc) {
    this._sendBtc = btc;
    this.sendUsd = this.sendBtc * this.rateBtcUsd;
  }

  sendUsd = this.sendBtc * this.rateBtcUsd;

  walletAddress = '';
  balanceBtcConfirmed = 0;
  balanceBtcUnconfirmed = 0;
  balanceUsd = 0;

  phase = Phase.Creation;

  subscriptions = [];

  constructor(
    private walletService: WalletService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.walletService.balance.subscribe((balance) => {
        this.updataBalance(balance);
      }));

    this.subscriptions.push(
      this.walletService.rejectedEvent.subscribe(async () => {
        await this.rejected();
      }));

    this.subscriptions.push(
      this.walletService.signedEvent.subscribe(async () => {
        await this.finalaized();
      }));

    this.walletAddress = this.walletService.address.getValue();
    this.selected = this.walletAddress;
    this.updataBalance(this.walletService.balance.getValue());
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  updataBalance(balance) {
    this.balanceBtcConfirmed = bcoin.amount.btc(balance.confirmed);
    this.balanceBtcUnconfirmed = bcoin.amount.btc(balance.unconfirmed);
    this.balanceUsd = (this.balanceBtcUnconfirmed) * this.rateBtcUsd;
  }

  // Pressed start signature
  async startSigning() {
    const tx = await this.walletService.createTransaction(this.addressReceiver, bcoin.amount.fromBTC(this.sendBtc).value, false);
    if (tx) {
      this.phase = Phase.Confirmation;
      await this.walletService.requestTransactionVerify(tx);
    }
  }

  async cancelTransaction() {
    this.phase = Phase.Creation;

    await this.walletService.rejectTransaction();
  }

  async sendTransaction() {
    this.phase = Phase.Creation;

    try {
      await this.walletService.verifySignature();
      await this.walletService.pushTransaction();

      this.notification.show('The transaction was successfully sent');
    } catch (e) {
      console.log(e);
      this.notification.show('Error sending transaction');
    }
  }

  async skipSending() {
    this.phase = Phase.Creation;
  }

  // Received rejection
  async rejected() {
    this.phase = Phase.Creation;
  }

  // Received a ready signature
  async finalaized() {
    this.phase = Phase.Sending;
  }
}

