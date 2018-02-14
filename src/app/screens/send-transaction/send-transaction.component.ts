import { OnInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { CurrencyWallet } from '../../services/wallet/currencywallet';
import { Coin } from '../../services/keychain.service';
import { Observable } from 'rxjs/Observable';

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

  currentWalletPh = 'Wallet';
  receiverPh = 'Recipient';

  stAwaitConfirm = 'Confirm on the second device';
  stSigningResult = 'Transaction is signed';

  stContinue = 'Continue';
  stCancel = 'Cancel';
  stTransfer = 'Transfer';
  stSend = 'Send';

  selected = '';

  _sendBtc = 0.0;
  addressReceiver = '';

  rateBtcUsd = 15000;

  get sendBtc() {
    return this._sendBtc;
  }

  set sendBtc(btc) {
    this._sendBtc = btc;
    this.sendUsd = this.sendBtc * this.rateBtcUsd;
  }

  sendUsd = this.sendBtc * this.rateBtcUsd;

  public currencyWallet: CurrencyWallet;

  public walletAddress: Observable<string>;
  public balanceBtcConfirmed: Observable<number>;
  public balanceBtcUnconfirmed: Observable<number>;
  public balanceUsd: Observable<number>;

  public phase = Phase.Creation;

  private subscriptions = [];

  constructor(
    private readonly walletService: WalletService,
    private readonly notification: NotificationService,
    private readonly route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((params: Params) => {
        const coin = Number(params['coin']) as Coin;

        this.currencyWallet = this.walletService.currencyWallets.get(coin);

        this.subscriptions.push(
          this.currencyWallet.rejectedEvent.subscribe(async () => {
            await this.rejected();
          }));

        this.subscriptions.push(
          this.currencyWallet.signedEvent.subscribe(async () => {
            await this.finalaized();
          }));

        this.walletAddress = this.currencyWallet.address;
        this.balanceBtcUnconfirmed = this.currencyWallet.balance.map(balance => bcoin.amount.btc(balance.unconfirmed));
        this.balanceBtcConfirmed = this.currencyWallet.balance.map(balance => bcoin.amount.btc(balance.confirmed));
        this.balanceUsd = this.balanceBtcUnconfirmed.map(balance => balance * this.rateBtcUsd);

        this.subscriptions.push(
          this.walletAddress.subscribe(address => {
            this.selected = address;
          })
        );
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  // Pressed start signature
  async startSigning() {
    const tx = await this.currencyWallet.createTransaction(this.addressReceiver, bcoin.amount.fromBTC(this.sendBtc).value);
    if (tx) {
      this.phase = Phase.Confirmation;
      await this.currencyWallet.requestTransactionVerify(tx);
    }
  }

  async cancelTransaction() {
    this.phase = Phase.Creation;

    await this.currencyWallet.rejectTransaction();
  }

  async sendTransaction() {
    this.phase = Phase.Creation;

    try {
      await this.currencyWallet.verifySignature();
      await this.currencyWallet.pushTransaction();

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

