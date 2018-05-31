import { Component, HostBinding, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyService, Info } from '../../../../services/currency.service';
import { Coin, Token } from '../../../../services/keychain.service';
import { NavigationService } from '../../../../services/navigation.service';
import { NotificationService } from '../../../../services/notification.service';
import { WalletService } from '../../../../services/wallet.service';

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
  address = '';
  btc;
  usd;
  fee;
  feeUsd;

  public ethWallet = this.wallet.currencyWallets.get(Coin.ETH);

  public stateType: any = State;
  public state: State = State.None;
  public currentCoin: Coin | Token = null;
  public currentInfo: Info = null;
  public currencyWallets = this.wallet.currencyWallets;
  @ViewChild('sidenav') sidenav;
  public isExitTap = false;
  private subscriptions = [];

  constructor(private readonly wallet: WalletService,
              private readonly currencyService: CurrencyService,
              private readonly navigationService: NavigationService,
              private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly notification: NotificationService) { }

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
          this.btc = currencyWallet.fromInternal(outputs.outputs[0].value);
          this.usd = this.btc * this.currentInfo.rate.getValue();
          this.fee = this.ethWallet.fromInternal(fee);
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

  async confirm() {
    this.state = State.None;
    await this.currencyWallets.get(this.currentCoin).acceptTransaction();
    await this.notification.cancelConfirmation();
  }

  async decline() {
    this.state = State.None;
    await this.currencyWallets.get(this.currentCoin).rejectTransaction();
    await this.notification.cancelConfirmation();
  }

  async onBackClicked() {
    if (this.isExitTap) {
      console.log('isExitTap');
      this.notification.hide();
      await this.router.navigate(['/start']);
    } else {
      console.log('await');
      this.notification.show('Tap again to exit');
      this.isExitTap = true;
      setTimeout(() => this.ngZone.run(() => {
        this.isExitTap = false;
      }), 3000);
    }
  }

}
