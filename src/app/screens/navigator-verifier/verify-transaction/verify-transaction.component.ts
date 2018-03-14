import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { Coin, Token } from '../../../services/keychain.service';
import { Router } from '@angular/router';
import { Info, CurrencyService } from '../../../services/currency.service';
import {NavigationService} from '../../../services/navigation.service';

declare const bcoin: any;

@Component({
  selector: 'app-verify-transaction',
  templateUrl: './verify-transaction.component.html',
  styleUrls: ['./verify-transaction.component.css']
})
export class VerifyTransactionComponent implements OnInit, OnDestroy {
  isOpened = false;

  showTransaction = false;

  address = '';
  btc;
  usd;

  public title = 'Awaiting confirmations';
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

  public currentCoin: Coin | Token = null;
  public currentInfo: Info = null;
  public currencyWallets = this.wallet.currencyWallets;

  private subscriptions = [];

  @ViewChild('sidenav') sidenav;

  constructor(
    private readonly wallet: WalletService,
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

    this.currencyWallets.forEach((currencyWallet, coin) => {
      this.subscriptions.push(
        currencyWallet.rejectedEvent.subscribe(() => {
          this.showTransaction = false;
        }));

      this.subscriptions.push(
        currencyWallet.verifyEvent.subscribe(async (transaction) => {
          this.currentCoin = coin;
          this.currentInfo = await this.currencyService.getInfo(this.currentCoin);

          if (!currencyWallet.verify(transaction)) {
            console.log('Received invalid transaction');
            await currencyWallet.rejectTransaction();
            return;
          }

          const outputs = currencyWallet.outputs(transaction);

          this.address = outputs[0].address;
          this.btc = currencyWallet.fromInternal(outputs[0].value.toString());
          this.usd = this.btc * this.currentInfo.rate.getValue();
          this.showTransaction = true;

          console.log('Transaction:');
          console.log(this.address);
          console.log(this.btc);
          console.log(this.usd);
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
    this.showTransaction = false;
    await this.currencyWallets.get(this.currentCoin).acceptTransaction();
  }

  async decline() {
    this.showTransaction = false;
    await this.currencyWallets.get(this.currentCoin).rejectTransaction();
  }

  async onBackClicked() {
    if (this.isOpened) {
      this.sidenav.toggle();
    }
  }
}
