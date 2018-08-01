import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import isNumber from 'lodash/isNumber';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, flatMap, filter, tap } from 'rxjs/operators';
import { ConnectionProviderService } from '../../../services/connection-provider';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';
import { BalanceStatus, CurrencyWallet, Status } from '../../../services/wallet/currencywallet';
import { toBehaviourSubject } from '../../../utils/transformers';
import { WaitingComponent } from '../waiting/waiting.component';

import BN from 'bn.js';
import { ConnectionState } from "../../../services/primitives/state";

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
  @HostBinding('class') classes = 'toolbars-component overlay-background';
  public phaseType = Phase; // for template
  public statusType = Status;
  public balanceStatusType = BalanceStatus;

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
  public disable = false;

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;
  public isToken = false;

  public allowFeeConfiguration = false;

  public connected = toBehaviourSubject(this.connectionProviderService.connectionState.pipe(
    map(state => state === ConnectionState.Connected),
    distinctUntilChanged()
  ), false);

  public currencyWallet: CurrencyWallet = null;

  public ethWallet = this.walletService.currencyWallets.get(Coin.ETH);
  public ethBalance = toBehaviourSubject(
    this.ethWallet.balance.pipe(map(balance => balance ? balance.unconfirmed : null)),
    null);

  public fixedaddress: string = null;
  public address: BehaviorSubject<string> = null;
  public balance: BehaviorSubject<BN> = null;
  public receiver: BehaviorSubject<string> = null;
  public amount: BehaviorSubject<BN> = null;
  public fee: BehaviorSubject<BN> = null;
  public feePrice: BehaviorSubject<BN> = null;
  public estimatedSize: BehaviorSubject<number> = null;

  public subtractFee: BehaviorSubject<boolean> = null;

  public sufficientBalance: BehaviorSubject<boolean> = null;
  public sufficientValue: BehaviorSubject<boolean> = null;
  public validReceiver: BehaviorSubject<boolean> = null;
  public requiredFilled: BehaviorSubject<boolean> = null;
  public valid: BehaviorSubject<boolean> = null;

  public ready: BehaviorSubject<boolean> = null;

  public phase: BehaviorSubject<Phase> = new BehaviorSubject<Phase>(Phase.Creation);

  private subscriptions = [];

  constructor(private readonly ngZone: NgZone,
              private readonly connectionProviderService: ConnectionProviderService,
              private readonly walletService: WalletService,
              private readonly notification: NotificationService,
              private readonly currencyService: CurrencyService,
              private readonly navigationService: NavigationService) { }

  async ngOnInit() {
    this.currencyInfo = await this.currencyService.getInfo(this.currency);
    this.isToken = this.currency in Token;

    this.ready = new BehaviorSubject<boolean>(false);

    this.currencyWallet = this.walletService.currencyWallets.get(this.currency);
    this.allowFeeConfiguration = !([Coin.NEM] as Array<Coin | Token>).includes(this.currency);

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
      this.currencyWallet.balance.pipe(map(balance => balance ? balance.unconfirmed : null)),
      null);

    this.estimatedSize = toBehaviourSubject(
      this.balance.pipe(
        distinctUntilChanged(),
        flatMap(async balance => {
          if (balance === null || balance.eq(new BN())) {
            return 1;
          }

          const testTx = await this.currencyWallet.createTransaction(
            this.address.getValue(),
            balance.div(new BN(2)));

          return await testTx.estimateSize();
        }),
        tap(size => this.ready.next(size as boolean))
      ), 1);

    this.receiver = new BehaviorSubject<string>('');
    this.amount = new BehaviorSubject<BN>(new BN());
    this.feePrice = new BehaviorSubject<BN>(new BN(this.currencyInfo.gasPrice));
    this.fee = new BehaviorSubject<BN>(this.feePrice.getValue().mul(new BN(this.estimatedSize.getValue())));
    this.subtractFee = new BehaviorSubject<boolean>(false);

    this.sufficientBalance = toBehaviourSubject(combineLatest([
        this.balance,
        this.ethBalance,
        this.amount,
        this.fee,
        this.subtractFee
      ],
      (balance, ethBalance, amount, fee, substractFee) => {
        if (balance === null || balance.eq(new BN())) {
          return false;
        }
        if (amount.gt(new BN())) {
          if (this.currency in Coin) {
            if (!substractFee) {
              return balance.gte(amount.add(fee));
            } else {
              return balance.gte(amount);
            }
          } else {
            return balance.gte(amount) && ethBalance.gte(fee);
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
          if (this.currency in Coin) {
            if (subtractFee) {
              return amount.gte(fee);
            } else {
              return true;
            }
          } else {
            return true;
          }
        } else {
          return false;
        }
      }
    ), false);

    this.validReceiver = toBehaviourSubject(
      this.receiver.pipe(
        map(
          address => this.currencyWallet.verifyAddress(address, this.currencyInfo.symbol)
        )
      ),
      false
    );

    this.requiredFilled = toBehaviourSubject(combineLatest([
        this.receiver,
        this.amount
      ],
      (receiver, amount) => {
        return receiver && receiver.length > 0 && amount > 0;
      }
    ), false);

    this.valid = toBehaviourSubject(combineLatest([
        this.sufficientBalance,
        this.sufficientValue,
        this.validReceiver,
        this.requiredFilled
      ],
      (sufficientBalance, sufficientValue, validReceiver, requiredFilled) => {
        return sufficientBalance && sufficientValue && validReceiver && requiredFilled;
      }), false);

    this.subscriptions.push(
      this.amount.pipe(distinctUntilChanged()).subscribe(value => {
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
      this.receiver.pipe(distinctUntilChanged()).subscribe(value => {
        if (!this.receiverFocused) {
          this.receiverField.setValue(value, {emitEvent: false});
        }
      })
    );

    this.subscriptions.push(
      this.receiverField.valueChanges.pipe(distinctUntilChanged()).subscribe((value: string) => {
        this.receiver.next(value);
      })
    );

    this.subscriptions.push(
      this.fee.pipe(distinctUntilChanged()).subscribe(value => {
        if (!this.feeFocused) {
          if (this.currency in Token) {
            this.feeField.setValue(
              this.ethWallet.fromInternal(value),
              {emitEvent: false});
          } else {
            this.feeField.setValue(
              this.currencyWallet.fromInternal(value),
              {emitEvent: false});
          }
        }
        if (!this.feeUsdFocused) {
          if (this.currency in Token) {
            this.feeUsdField.setValue(
              this.ethWallet.fromInternal(value) * (this.currencyInfo.gasRate.getValue() || 1),
              {emitEvent: false});
          } else {
            this.feeUsdField.setValue(
              this.currencyWallet.fromInternal(value) * (this.currencyInfo.gasRate.getValue() || 1),
              {emitEvent: false});
          }
        }
      })
    );

    this.subscriptions.push(
      this.feePrice.pipe(distinctUntilChanged()).subscribe(value => {
        if (!this.feePriceFocused) {
          if (this.currency in Token) {
            this.feePriceField.setValue(
              this.ethWallet.fromInternal(value),
              {emitEvent: false});
          } else {
            this.feePriceField.setValue(
              this.currencyWallet.fromInternal(value),
              {emitEvent: false});
          }
        }
        if (!this.feePriceUsdFocused) {
          if (this.currency in Token) {
            this.feePriceUsdField.setValue(
              this.ethWallet.fromInternal(value) * (this.currencyInfo.gasRate.getValue() || 1),
              {emitEvent: false});
          } else {
            this.feePriceUsdField.setValue(
              this.currencyWallet.fromInternal(value) * (this.currencyInfo.gasRate.getValue() || 1),
              {emitEvent: false});
          }
        }
      })
    );

    this.subscriptions.push(
      this.amountField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ).subscribe((value: number) => {
        this.amount.next(this.currencyWallet.toInternal(value));
      })
    );
    this.subscriptions.push(
      this.amountUsdField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ).subscribe((value: number) => {
        this.amount.next(this.currencyWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1)));
      })
    );

    this.subscriptions.push(
      this.feeField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ).subscribe((value: number) => {
        let fee = null;
        if (this.currency in Token) {
          fee = this.ethWallet.toInternal(value);
        } else {
          fee = this.currencyWallet.toInternal(value);
        }
        this.fee.next(fee);
        this.feePrice.next(fee.div(new BN(this.estimatedSize.getValue())));
      })
    );

    this.subscriptions.push(
      this.feeUsdField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ).subscribe((value: number) => {
        let fee = null;
        if (this.currency in Token) {
          fee = this.ethWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1));
        } else {
          fee = this.currencyWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1));
        }
        this.fee.next(fee);
        this.feePrice.next(fee.div(new BN(this.estimatedSize.getValue())));
      })
    );

    this.subscriptions.push(
      this.feePriceField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ).subscribe((value: number) => {
        let feePrice = null;
        if (this.currency in Token) {
          feePrice = this.ethWallet.toInternal(value);
        } else {
          feePrice = this.currencyWallet.toInternal(value);
        }
        this.feePrice.next(feePrice);
        this.fee.next(feePrice.mul(new BN(this.estimatedSize.getValue())));
      })
    );

    this.subscriptions.push(
      this.feePriceUsdField.valueChanges.pipe(
        filter(isNumber),
        distinctUntilChanged()
      ).subscribe((value: number) => {
        let feePrice = null;
        if (this.currency in Token) {
          feePrice = this.ethWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1));
        } else {
          feePrice = this.currencyWallet.toInternal(value / (this.currencyInfo.rate.getValue() || 1));
        }
        this.feePrice.next(feePrice);
        this.fee.next(feePrice.mul(new BN(this.estimatedSize.getValue())));
      })
    );

    this.subscriptions.push(
      this.estimatedSize.pipe(distinctUntilChanged()).subscribe(value => {
        this.fee.next(new BN(value).mul(this.feePrice.getValue()));
      })
    );

    this.subscriptions.push(
      this.subtractFeeField.valueChanges.pipe(distinctUntilChanged()).subscribe((value: boolean) => {
        this.subtractFee.next(value);
      })
    );

    this.subscriptions.push(
      this.phase.pipe(
        map(phase => phase === Phase.Creation)
      ).subscribe((creation) => {
        if (creation) {
          this.disable = false;
          this.receiverField.enable();
          this.amountField.enable();
          this.amountUsdField.enable();
          this.feeTypeField.enable();
          this.feeField.enable();
          this.feeUsdField.enable();
          this.feePriceField.enable();
          this.feePriceUsdField.enable();
        } else {
          this.disable = true;
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
    if (this.isToken) {
      this.subtractFeeField.disable();
    } else {
      this.subtractFeeField.enable();
    }

    if (this.fixedaddress) {
      this.receiverField.setValue(this.fixedaddress);
      this.receiverField.disable();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBack() {
    if (this.phase.getValue() === Phase.Confirmation) {
      await this.currencyWallet.rejectTransaction();
    }
    this.navigationService.back();
  }

  // Pressed start signature
  async startSigning() {
    const value = this.subtractFee.getValue() ? this.amount.getValue().sub(this.fee.getValue()) : this.amount.getValue();
    // temporarily allow NEM to choose fee itself
    const fee = this.allowFeeConfiguration ? this.fee.getValue() : undefined;
    const tx = await this.currencyWallet.createTransaction(this.receiver.getValue(), value, fee);
    if (tx) {
      this.phase.next(Phase.Confirmation);
      if (this.connected.getValue()) {
        await this.currencyWallet.requestTransactionVerify(tx);
      } else {
        await this.openConnectOverlay();
        this.phase.next(Phase.Creation);
      }
    }
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connected.subscribe(ignored => {
      this.navigationService.acceptOverlay();
    });
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

      this.navigationService.back();

      this.notification.show('The transaction was successfully sent');
    } catch (e) {
      console.log(e);
      this.notification.show('Error sending transaction');
    }
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
