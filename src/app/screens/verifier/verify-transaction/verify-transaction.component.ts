import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ApiServer, CurrencyInfoService } from '../../../services/currencyinfo.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { VerifierService } from '../../../services/verifier.service';
import { CurrecnyModelType, CurrencyModel } from '../../../services/wallet/wallet';

import BN from 'bn.js';
import { PriceService } from '../../../services/price.service';
import { filter } from 'rxjs/operators';

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

  @Input() public sessionId: string = null;
  @Input() public model: CurrencyModel = null;
  @Input() public address: string = null;
  @Input() public valueInternal: BN = null;
  @Input() public feeInternal: BN = null;

  public parentModel: CurrencyModel = null;

  public value;
  public fee;
  public valueUsd;
  public feeUsd;

  public stateType: any = State;
  public state: State = State.None;

  @Output() public cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() public confirm = new EventEmitter<any>();
  @Output() public decline = new EventEmitter<any>();

  private subscriptions = [];

  private notificationId: number;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly verifierService: VerifierService,
    private readonly priceService: PriceService
  ) {}

  async ngOnInit() {
    this.parentModel = CurrencyModel.fromCoin(this.model.currencyInfo);

    this.state = State.Preparing;

    const currency = this.verifierService.session(this.sessionId).currency(this.model.currencyInfo.id);

    const network = this.model.currencyInfo.network;
    const endpoint = this.currencyInfoService.apiServer(this.model.currencyInfo.id, ApiServer.Spatium);
    const point = await currency.compoundPublic();

    const parentWallet = this.model.currencyInfo.walletType.fromOptions({
      network,
      point,
      endpoint
    });
    let wallet = null;
    switch (this.model.type) {
      case CurrecnyModelType.Coin:
        wallet = parentWallet;
        break;
      case CurrecnyModelType.Token:
        wallet = this.model.currencyInfo.tokenWalletType.fromOptions({
          network,
          point,
          endpoint,
          contractAddress: this.model.tokenInfo.id,
          decimals: this.model.tokenInfo.decimals
        });
        break;
    }

    this.value = wallet.fromInternal(this.valueInternal);
    this.valueUsd = this.value * this.priceService.price(this.model.ticker);
    this.fee = parentWallet.fromInternal(this.feeInternal);
    this.feeUsd = this.fee * this.priceService.price(this.parentModel.ticker);

    this.state = State.Verifying;

    this.notificationId = this.notification.askConfirmation(
      'Confirm ' + this.model.name + ' transacton',
      this.value + ' ' + this.model.ticker + ' to ' + this.address
    );

    this.subscriptions.push(
      this.notification.confirm.pipe(
        filter((id) => id === this.notificationId)
      ).subscribe(() => {
        this.confirm.next();
      })
    );

    this.subscriptions.push(
      this.notification.decline.pipe(
        filter((id) => id === this.notificationId)
      ).subscribe(() => {
        this.decline.next();
      })
    );
  }

  async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.notification.cancelConfirmation(this.notificationId);
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
