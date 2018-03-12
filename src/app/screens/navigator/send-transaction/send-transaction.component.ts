import { OnInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { WalletService } from '../../../services/wallet.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrencyWallet } from '../../../services/wallet/currencywallet';
import { Coin, Token } from '../../../services/keychain.service';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CurrencyService, Info } from '../../../services/currency.service';
import { NavigationService } from '../../../services/navigation.service';

declare const bcoin: any;
declare const cordova: any;

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

  public receiver = new FormControl();
  public amount = new FormControl();
  public amountUsd = this.amount.valueChanges.map(value => value * (this.currencyInfo ? this.currencyInfo.rate : 0) );

  accountPh = 'Account';
  receiverPh = 'Recipient';

  titile = 'Transfer';

  stAwaitConfirm = 'Confirm on the second device';
  stSigningResult = 'Transaction is signed';

  stContinue = 'Continue';
  stCancel = 'Cancel';
  stTransfer = 'Transfer';
  stSend = 'Send';

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;

  public currencyWallet: CurrencyWallet = null;

  public walletAddress: Observable<string> = null;
  public balanceBtcConfirmed: Observable<number> = null;
  public balanceBtcUnconfirmed: Observable<number> = null;
  public balanceUsdConfirmed: Observable<number> = null;
  public balanceUsdUnconfirmed: Observable<number> = null;
  public validatorObserver: Observable<boolean> = null;

  public phase: BehaviorSubject<Phase> = new BehaviorSubject<Phase>(Phase.Creation);

  private subscriptions = [];

  constructor(
    private readonly walletService: WalletService,
    private readonly notification: NotificationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(
      this.route.params.subscribe(async (params: Params) => {
        this.currency = Number(params['coin']) as Coin | Token;
        this.currencyInfo = await this.currencyService.getInfo(this.currency);

        this.currencyWallet = this.walletService.currencyWallets.get(this.currency);

        this.subscriptions.push(
          this.currencyWallet.rejectedEvent.subscribe(async () => {
            await this.rejected();
          }));

        this.subscriptions.push(
          this.currencyWallet.signedEvent.subscribe(async () => {
            await this.finalaized();
          }));

        this.walletAddress = this.currencyWallet.address;
        this.balanceBtcUnconfirmed = this.currencyWallet.balance.map(balance => balance.unconfirmed);
        this.balanceBtcConfirmed = this.currencyWallet.balance.map(balance => balance.confirmed);
        this.balanceUsdUnconfirmed = this.balanceBtcUnconfirmed.map(balance => balance * (this.currencyInfo ? this.currencyInfo.rate : 0));
        this.balanceUsdConfirmed = this.balanceBtcConfirmed.map(balance => balance * (this.currencyInfo ? this.currencyInfo.rate : 0));

        this.validatorObserver = combineLatest(
          this.balanceBtcUnconfirmed,
          this.amount.valueChanges,
          this.receiver.valueChanges,
          (balance, amount, receiver) => {
            return balance > amount && amount > 0 && receiver.length > 0;
          });
      }));

    this.subscriptions.push(
      this.phase.map(phase => phase === Phase.Creation).subscribe((creation) => {
        if (creation) {
          this.receiver.enable();
          this.amount.enable();
          this.receiver.setValue('ggggggg');
          this.amount.setValue(0);
        } else {
          this.receiver.disable();
          this.amount.disable();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    if (this.phase.getValue() === Phase.Confirmation) {
      await this.currencyWallet.rejectTransaction();
    }
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['currency', this.currency] } }]);
  }

  // Pressed start signature
  async startSigning() {
    const tx = await this.currencyWallet.createTransaction(this.receiver.value, this.amount.value);
    if (tx) {
      this.phase.next(Phase.Confirmation);
      await this.currencyWallet.requestTransactionVerify(tx);
    }
  }

  async cancelTransaction() {
    this.phase.next(Phase.Creation);

    await this.currencyWallet.rejectTransaction();
  }

  async sendTransaction() {
    this.phase.next(Phase.Creation);

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
    this.phase.next(Phase.Creation);
  }

  // Received rejection
  async rejected() {
    this.phase.next(Phase.Creation);
  }

  // Received a ready signature
  async finalaized() {
    this.phase.next(Phase.Sending);
  }

  paste () {
    let paste = '';
    cordova.plugins.clipboard.paste(function (text) {
      console.log(text);
      paste = text;
      if (paste !== '') {
        this.receiver.setValue(paste);
      }
    }.bind(this), function (e) {console.log(e)});

  }

}

