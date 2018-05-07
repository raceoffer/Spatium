import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import 'rxjs/add/operator/mergeMap';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';
import { CurrencyWallet } from '../../../services/wallet/currencywallet';
import { toBehaviourSubject } from '../../../utils/transformers';

declare const cordova: any;
declare const CryptoCore: any;

const BN = CryptoCore.BN;

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
  @HostBinding('class') classes = 'toolbars-component';
  public phaseType = Phase; // for template

  public receiverField = new FormControl();

  public amountField = new FormControl();
  public amountUsdField = new FormControl();

  public feeType: any = Fee;

  public feeTypeField = new FormControl();

  public feeField = new FormControl();
  public feeUsdField = new FormControl();
  public feePriceField = new FormControl();
  public feePriceUsdField = new FormControl();

  public subtractFeeField = new FormControl();

  // Well, that's stupid, but it seems that there's no way
  // to get if the input is focused out of FormControl
  // So, he's some boilerplate stuff:

  public receiverFocused = false;
  public amountFocused = false;
  public amountUsdFocused = false;
  public feeFocused = false;
  public feeUsdFocused = false;
  public feePriceFocused = false;
  public feePriceUsdFocused = false;

  accountPh = 'Account';
  receiverPh = 'Recipient';

  titile = 'Transfer';

  stAwaitConfirm = 'Confirm on the second device';
  stSigningResult = 'Transaction is signed';

  stTransfer = 'Sign transaction';
  stSend = 'Send transaction';

  stFee = 'Transaction fee';
  stManual = 'Manual';
  stNormal = 'Normal (0-1 hour)';
  stEconomy = 'Economy (1-24 hours)';

  stFeeOriginRecipient = 'Subtract fee';

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;

  public currencyWallet: CurrencyWallet = null;

  public address: BehaviorSubject<string> = null;
  public balance: BehaviorSubject<any> = null;
  public receiver: BehaviorSubject<string> = null;
  public amount: BehaviorSubject<any> = null;
  public fee: BehaviorSubject<any> = null;
  public feePrice: BehaviorSubject<any> = null;
  public estimatedSize: BehaviorSubject<number> = null;

  public subtractFee: BehaviorSubject<boolean> = null;

  public sufficientBalance: BehaviorSubject<boolean> = null;
  public sufficientValue: BehaviorSubject<boolean> = null;
  public validReceiver: BehaviorSubject<boolean> = null;
  public valid: BehaviorSubject<boolean> = null;

  public phase: BehaviorSubject<Phase> = new BehaviorSubject<Phase>(Phase.Creation);

  private subscriptions = [];

  constructor(private readonly ngZone: NgZone,
              private readonly walletService: WalletService,
              private readonly notification: NotificationService,
              private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly currencyService: CurrencyService,
              private readonly navigationService: NavigationService) { }

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

        this.address = this.currencyWallet.address;
        this.balance = toBehaviourSubject(
          this.currencyWallet.balance.map(balance => balance ? balance.unconfirmed : null),
          null);

        this.estimatedSize = toBehaviourSubject(
          this.balance.distinctUntilChanged().flatMap(async balance => {
            if (balance === null || balance.eq(new BN())) {
              return 1;
            }

            const testTx = await this.currencyWallet.createTransaction(
              this.address.getValue(),
              balance.div(new BN(2)));

            return await testTx.estimateSize();
          }),
          1);

        this.receiver = new BehaviorSubject<string>('');
        this.amount = new BehaviorSubject<any>(new BN());
        this.feePrice = new BehaviorSubject<any>(new BN(this.currencyInfo.gasPrice));
        this.fee = new BehaviorSubject<any>(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
        this.subtractFee = new BehaviorSubject<boolean>(false);

        this.sufficientBalance = toBehaviourSubject(combineLatest([
            this.balance,
            this.amount,
            this.fee,
            this.subtractFee
          ],
          (balance, amount, fee, substractFee) => {
            if (balance === null || balance.eq(new BN())) {
              return false;
            }
            if (amount.gt(new BN())) {
              if (!substractFee) {
                return balance.gte(amount.add(fee));
              } else {
                return balance.gte(amount);
              }
            } else {
              return true;
            }
          }
        ), false);

        this.sufficientValue = toBehaviourSubject(combineLatest([
            this.amount,
            this.fee,
            this.subtractFee
          ],
          (amount, fee, subtractFee) => {
            if (amount.gt(new BN())) {
              if (subtractFee) {
                return amount.gte(fee);
              } else {
                return true;
              }
            } else {
              return false;
            }
          }
        ), false);

        this.validReceiver = toBehaviourSubject(this.receiver.map(address => address && address.length > 0), false);

        this.valid = toBehaviourSubject(combineLatest([
            this.sufficientBalance,
            this.sufficientValue,
            this.validReceiver
          ],
          (sufficientBalance, sufficientValue, validReceiver) => {
            return sufficientBalance && sufficientValue && validReceiver;
          }), false);

        this.subscriptions.push(
          this.amount.distinctUntilChanged().subscribe(value => {
            if (!this.amountFocused) {
              this.amountField.setValue(
                this.currencyWallet.fromInternal(value),
                {emitEvent: false});
            }
            if (!this.amountUsdFocused) {
              this.amountUsdField.setValue(
                this.currencyWallet.fromInternal(value) * (this.currencyInfo.rate.getValue() || 1),
                {emitEvent: false});
            }
          })
        );

        this.subscriptions.push(
          this.receiver.distinctUntilChanged().subscribe(value => {
            if (!this.receiverFocused) {
              this.receiverField.setValue(value, {emitEvent: false});
            }
          })
        );

        this.subscriptions.push(
          this.receiverField.valueChanges.distinctUntilChanged().subscribe(value => {
            this.receiver.next(value);
          })
        );

        this.subscriptions.push(
          this.fee.distinctUntilChanged().subscribe(value => {
            if (!this.feeFocused) {
              this.feeField.setValue(
                this.currencyWallet.fromInternal(value),
                {emitEvent: false});
            }
            if (!this.feeUsdFocused) {
              this.feeUsdField.setValue(
                this.currencyWallet.fromInternal(value) * (this.currencyInfo.gasRate.getValue() || 1),
                {emitEvent: false});
            }
          })
        );

        this.subscriptions.push(
          this.feePrice.distinctUntilChanged().subscribe(value => {
            if (!this.feePriceFocused) {
              this.feePriceField.setValue(
                this.currencyWallet.fromInternal(value),
                {emitEvent: false});
            }
            if (!this.feePriceUsdFocused) {
              this.feePriceUsdField.setValue(
                this.currencyWallet.fromInternal(value) * (this.currencyInfo.gasRate.getValue() || 1),
                {emitEvent: false});
            }
          })
        );

        this.subscriptions.push(
          this.amountField.valueChanges.distinctUntilChanged().subscribe(value => {
            this.amount.next(this.currencyWallet.toInternal(value));
          })
        );
        this.subscriptions.push(
          this.amountUsdField.valueChanges.distinctUntilChanged().subscribe(value => {
            this.amount.next(this.currencyWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1)));
          })
        );
        this.subscriptions.push(
          this.feeField.valueChanges.distinctUntilChanged().subscribe(value => {
            const fee = this.currencyWallet.toInternal(value);
            this.fee.next(fee);
            this.feePrice.next(fee.div(new BN(this.estimatedSize.getValue())));
          })
        );
        this.subscriptions.push(
          this.feeUsdField.valueChanges.distinctUntilChanged().subscribe(value => {
            const fee = this.currencyWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1));
            this.fee.next(fee);
            this.feePrice.next(fee.div(new BN(this.estimatedSize.getValue())));
          })
        );
        this.subscriptions.push(
          this.feePriceField.valueChanges.distinctUntilChanged().subscribe(value => {
            const feePrice = this.currencyWallet.toInternal(value);
            this.feePrice.next(feePrice);
            this.fee.next(feePrice.mul(new BN(this.estimatedSize.getValue())));
          })
        );
        this.subscriptions.push(
          this.feePriceUsdField.valueChanges.distinctUntilChanged().subscribe(value => {
            const feePrice = this.currencyWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1));
            this.feePrice.next(feePrice);
            this.fee.next(feePrice.mul(new BN(this.estimatedSize.getValue())));
          })
        );
        this.subscriptions.push(
          this.estimatedSize.distinctUntilChanged().subscribe(value => {
            this.fee.next(new BN(value).mul(this.feePrice.getValue()));
          })
        );
        this.subscriptions.push(
          this.subtractFeeField.valueChanges.distinctUntilChanged().subscribe(value => {
            this.subtractFee.next(value);
          })
        );

        this.subscriptions.push(
          this.phase.map(phase => phase === Phase.Creation).subscribe((creation) => {
            if (creation) {
              this.receiverField.enable();
              this.amountField.enable();
              this.amountUsdField.enable();
              this.feeTypeField.enable();
              this.feeField.enable();
              this.feeUsdField.enable();
              this.feePriceField.enable();
              this.feePriceUsdField.enable();
            } else {
              this.receiverField.disable();
              this.amountField.disable();
              this.amountUsdField.disable();
              this.feeTypeField.disable();
              this.feeField.disable();
              this.feeUsdField.disable();
              this.feePriceField.disable();
              this.feePriceUsdField.disable();
            }
          })
        );

        this.subscriptions.push(
          this.feeTypeField.valueChanges.subscribe(value => {
            switch (value) {
              case Fee.Normal:
                this.feePrice.next(new BN(this.currencyInfo.gasPrice));
                this.fee.next(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
                break;
              case Fee.Economy:
                this.feePrice.next(new BN(this.currencyInfo.gasPriceLow));
                this.fee.next(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
                break;
            }
          })
        );

        this.feeTypeField.setValue(Fee.Normal);
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    if (this.phase.getValue() === Phase.Confirmation) {
      await this.currencyWallet.rejectTransaction();
    }
    await this.router.navigate(['/navigator', {outlets: {'navigator': ['currency', this.currency]}}]);
  }

  // Pressed start signature
  async startSigning() {
    const value = this.subtractFee.getValue() ? this.amount.getValue().sub(this.fee.getValue()) : this.amount.getValue();
    const tx = await this.currencyWallet.createTransaction(this.receiver.getValue(), value, this.fee.getValue());
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
      await this.router.navigate(['/navigator', { outlets: { 'navigator': ['currency', this.currency] } }]);

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

  paste() {
    cordova.plugins.clipboard.paste(text => this.ngZone.run(() => {
      if (text !== '') {
        this.receiver.next(text);
      }
    }), e => console.log(e));
  }

  copy() {
    cordova.plugins.clipboard.copy(this.address.getValue());
  }

  // more boilerplate stuff for focus tracking

  setReceiverFocused(focused: boolean): void {
    this.receiverFocused = focused;
  }
  setAmountFocused(focused: boolean): void {
    this.amountFocused = focused;
  }
  setAmountUsdFocused(focused: boolean): void {
    this.amountUsdFocused = focused;
  }
  setFeeFocused(focused: boolean): void {
    this.feeFocused = focused;
  }
  setFeeUsdFocused(focused: boolean): void {
    this.feeUsdFocused = focused;
  }
  setFeePriceFocused(focused: boolean): void {
    this.feePriceFocused = focused;
  }
  setFeePriceUsdFocused(focused: boolean): void {
    this.feePriceUsdFocused = focused;
  }
}

