import { OnInit, Component, OnDestroy, NgZone } from '@angular/core';
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
import { toBehaviourSubject } from '../../../utils/transformers';

declare const bcoin: any;
declare const cordova: any;

enum Phase {
  Creation,
  Confirmation,
  Sending
}

enum Fee {
  Manual,
  Normal,
  Economy
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
  public amountUsd = new FormControl();

  public feeType: any = Fee;
  public feeTypeControl = new FormControl();
  public fee = new FormControl();
  public feeUsd = new FormControl();

  accountPh = 'Account';
  receiverPh = 'Recipient';

  titile = 'Transfer';

  stAwaitConfirm = 'Confirm on the second device';
  stSigningResult = 'Transaction is signed';

  stContinue = 'Continue';
  stTransfer = 'Transfer';
  stSend = 'Send';

  stFee = 'Transaction fee';
  stManual = 'Manual';
  stNormal = 'Normal (0-1 hour)';
  stEconomy = 'Economy (1-24 hours)';

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;

  public currencyWallet: CurrencyWallet = null;

  public walletAddress: BehaviorSubject<string> = null;
  public balanceBtcConfirmed: BehaviorSubject<number> = null;
  public balanceBtcUnconfirmed: BehaviorSubject<number> = null;
  public balanceUsdConfirmed: BehaviorSubject<number> = null;
  public balanceUsdUnconfirmed: BehaviorSubject<number> = null;
  public validatorObserver: Observable<boolean> = null;

  public phase: BehaviorSubject<Phase> = new BehaviorSubject<Phase>(Phase.Creation);

  private subscriptions = [];

  constructor(
    private readonly ngZone: NgZone,
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
        this.balanceBtcUnconfirmed = toBehaviourSubject(
          this.currencyWallet.balance.map(balance => balance.unconfirmed),
          0);
        this.balanceBtcConfirmed = toBehaviourSubject(
          this.currencyWallet.balance.map(balance => balance.confirmed),
          0);
        this.balanceUsdUnconfirmed = toBehaviourSubject(
          this.balanceBtcUnconfirmed.map(balance => balance * (this.currencyInfo ? this.currencyInfo.rate : 1)),
          0);
        this.balanceUsdConfirmed = toBehaviourSubject(
          this.balanceBtcConfirmed.map(balance => balance * (this.currencyInfo ? this.currencyInfo.rate : 1)),
          0);

        this.validatorObserver = combineLatest(
          this.balanceBtcUnconfirmed,
          toBehaviourSubject(this.amount.valueChanges, 0),
          toBehaviourSubject(this.receiver.valueChanges, ''),
          toBehaviourSubject(this.fee.valueChanges, 0),
          (balance, amount, receiver, fee) => {
            return balance > (amount + fee) && amount > 0 && receiver.length > 0;
          });

        this.feeTypeControl.setValue(Fee.Normal);
      }));

    this.subscriptions.push(
      this.fee.valueChanges.distinctUntilChanged().subscribe(value => {
        this.feeUsd.setValue(value * (this.currencyInfo ? this.currencyInfo.rate : 1) );
      })
    );

    this.subscriptions.push(
      this.feeUsd.valueChanges.distinctUntilChanged().subscribe(value => {
        this.fee.setValue(value / (this.currencyInfo ? this.currencyInfo.rate : 1) );
      })
    );

    this.subscriptions.push(
      this.amount.valueChanges.distinctUntilChanged().subscribe(value => {
        this.amountUsd.setValue(value * (this.currencyInfo ? this.currencyInfo.rate : 1) );
      })
    );

    this.subscriptions.push(
      this.amountUsd.valueChanges.distinctUntilChanged().subscribe(value => {
        this.amount.setValue(value / (this.currencyInfo ? this.currencyInfo.rate : 1) );
      })
    );

    this.subscriptions.push(
      this.phase.map(phase => phase === Phase.Creation).subscribe((creation) => {
        if (creation) {
          this.receiver.enable();
          this.amount.enable();
          this.amountUsd.enable();
          this.feeTypeControl.enable();
          this.fee.enable();
          this.feeUsd.enable();
        } else {
          this.receiver.disable();
          this.amount.disable();
          this.amountUsd.enable();
          this.feeTypeControl.disable();
          this.fee.disable();
          this.feeUsd.disable();
        }
      })
    );

    this.subscriptions.push(
      this.feeTypeControl.valueChanges.subscribe(value => {
        switch (value) {
          case Fee.Normal:
            this.fee.setValue(0.001);
            break;
          case Fee.Economy:
            this.fee.setValue(0.0001);
            break;
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
    const tx = await this.currencyWallet.createTransaction(this.receiver.value, this.amount.value, this.fee.value);
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
    cordova.plugins.clipboard.paste(text => this.ngZone.run(() => {
      if (text !== '') {
        this.receiver.setValue(text);
      }
    }), e => console.log(e));
  }
}

