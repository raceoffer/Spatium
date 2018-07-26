import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';

enum State {
  None,
  Preparing,
  Verifying
}

@Component({
  selector: 'app-verify-transaction',
  templateUrl: './verify-transaction.component.html',
  styleUrls: ['./verify-transaction.component.css']
})
export class VerifyTransactionComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public address;
  public btc;
  public usd;
  public fee;
  public feeUsd;

  public stateType: any = State;
  public state: State = State.None;

  @Input() public currentCoin: Coin | Token = null;
  @Input() public transaction = null;

  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() public confirm = new EventEmitter<any>();
  @Output() public decline = new EventEmitter<any>();

  public currentInfo: Info = null;
  public currencyWallets = this.wallet.currencyWallets;
  public currentWallet = null;

  public ethWallet = this.wallet.currencyWallets.get(Coin.ETH);

  private subscriptions = [];

  constructor(
    private readonly wallet: WalletService,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService
  ) { }

  async ngOnInit() {
    this.state = State.Preparing;

    this.currentInfo = await this.currencyService.getInfo(this.currentCoin);
    this.currentWallet = this.currencyWallets.get(this.currentCoin);

    if (!await this.transaction.validate(this.currentWallet.address.getValue())) {
      this.state = State.None;
      this.decline.next();
      return;
    }

    const outputs = await this.transaction.totalOutputs();

    const fee = await this.transaction.estimateFee();

    this.address = outputs.outputs[0].address;
    this.btc = this.currentWallet.fromInternal(outputs.outputs[0].value);
    this.usd = this.btc * this.currentInfo.rate.getValue();
    if (this.currentCoin in Token) {
      this.fee = this.ethWallet.fromInternal(fee);
    } else {
      this.fee = this.currentWallet.fromInternal(fee);
    }
    this.feeUsd = this.fee * this.currentInfo.gasRate.getValue();

    this.state = State.Verifying;

    this.notification.askConfirmation(
      'Confirm ' + this.currentInfo.name + ' transacton',
      this.btc + ' ' + this.currentInfo.symbol + ' to ' + this.address
    );
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.notification.cancelConfirmation();
  }

  public cancel() {
    this.cancelled.next();
  }

  public onConfirm() {
    this.confirm.next();
  }

  public onDecline() {
    this.decline.next();
  }

  public onBack() {
    this.navigationService.back();
  }
}
