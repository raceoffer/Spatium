import {Component, OnInit, OnDestroy, ViewChild, HostBinding} from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { Coin, Token } from '../../../services/keychain.service';
import { Router } from '@angular/router';
import { Info, CurrencyService } from '../../../services/currency.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import {BehaviorSubject} from "rxjs/BehaviorSubject";

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
  @HostBinding('class') classes = 'toolbars-component';
  public ready: BehaviorSubject<boolean> = null;
  isOpened = false;

  address = '';
  btc;
  usd;
  fee;
  feeUsd;

  public title = 'Confirmations mode';
  public navLinks = [{
    name: 'Export secret',
    link: ['/navigator-verifier', { outlets: { 'navigator': ['secret-export'] } }],
    isSelected: false,
    isActive: true
  }, {
    name: 'Change PIN',
    link: null,
    isSelected: false,
    isActive: false
  }, {
    name: 'Delete secret',
    link: ['/navigator-verifier', { outlets: { 'navigator': ['delete-secret', 'verify-transaction'] } }],
    isSelected: false,
    isActive: true
  }, {
    name: 'Exit',
    link: ['/start'],
    isSelected: false,
    isActive: true
  }];

  public stateType: any = State;
  public state: State = State.None;

  public currentCoin: Coin | Token = null;
  public currentInfo: Info = null;
  public currencyWallets = this.wallet.currencyWallets;
  synchronizing = this.wallet.synchronizing;

  private subscriptions = [];

  @ViewChild('sidenav') sidenav;

  constructor(
    private readonly wallet: WalletService,
    private readonly router: Router,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService
  ) {
    this.ready = this.wallet.ready;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.subscriptions.push(this.notification.confirm.subscribe(async () => {
      await this.confirm();
    }));

    this.subscriptions.push(this.notification.decline.subscribe(async () => {
      await this.decline();
    }));

    this.currencyWallets.forEach((currencyWallet, coin) => {
      this.subscriptions.push(
        currencyWallet.rejectedEvent.subscribe(() => {
          this.state = State.None;
        }));

      this.subscriptions.push(
        currencyWallet.startVerifyEvent.subscribe(() => {
          this.state = State.Preparing;
        })
      );

      this.subscriptions.push(
        currencyWallet.verifyEvent.subscribe(async (transaction) => {
          this.currentCoin = coin;
          this.currentInfo = await this.currencyService.getInfo(this.currentCoin);

          if (!await transaction.validate(currencyWallet.address.getValue())) {
            console.log('Received invalid transaction');
            await currencyWallet.rejectTransaction();
            return;
          }

          const outputs = await transaction.totalOutputs();

          const fee = await transaction.estimateFee();

          this.address = outputs.outputs[0].address;
          this.btc = currencyWallet.fromInternal(outputs.outputs[0].value.toString());
          this.usd = this.btc * this.currentInfo.rate.getValue();
          this.fee = currencyWallet.fromInternal(fee.toString());
          this.feeUsd = this.fee * this.currentInfo.gasRate.getValue();
          this.state = State.Verifying;

          this.notification.askConfirmation(
            'Confirm ' + this.currentInfo.name + ' transacton',
            this.btc + ' ' + this.currentInfo.symbol + ' to ' + this.address
          );
        }));
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onNav(navLink) {
    await this.router.navigate(navLink.link);
  }

  public toggle() {
    this.isOpened = !this.isOpened;
  }

  async confirm() {
    this.state = State.None;
    await this.currencyWallets.get(this.currentCoin).acceptTransaction();
  }

  async decline() {
    this.state = State.None;
    await this.currencyWallets.get(this.currentCoin).rejectTransaction();
  }

  async onBackClicked() {
    if (this.isOpened) {
      this.sidenav.toggle();
    }
  }

  async goToSync() {
    await this.router.navigate(['/navigator-verifier', { outlets: { 'navigator': ['verify-waiting'] } }]);
  }
}
