import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import {
  animate, transition, trigger, style
} from '@angular/animations';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { CurrencyWallet, HistoryEntry, TransactionType } from '../../../services/wallet/currencywallet';
import { toBehaviourSubject } from '../../../utils/transformers';

declare const cordova: any;

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({opacity: '0'}),
        animate('1s ease-out', style({opacity: '1'})),
      ]),
    ])
  ]
})
export class CurrencyComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  public usdTitle = 'USD';

  public txType = TransactionType;

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;

  public currencyWallet: CurrencyWallet = null;

  public walletAddress: BehaviorSubject<string> = null;
  public balanceCurrencyConfirmed: BehaviorSubject<number> = null;
  public balanceCurrencyUnconfirmed: BehaviorSubject<number> = null;
  public balanceUsdConfirmed: BehaviorSubject<number> = null;
  public balanceUsdUnconfirmed: BehaviorSubject<number> = null;

  public transactions: BehaviorSubject<Array<HistoryEntry>> = null;

  public accountLabel = 'Account';
  public sendLabel = 'Send';

  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly route: ActivatedRoute,
              private readonly wallet: WalletService,
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
        console.log(this.currencyInfo);

        this.currencyWallet = this.wallet.currencyWallets.get(this.currency);

        this.walletAddress = this.currencyWallet.address;
        this.balanceCurrencyUnconfirmed = toBehaviourSubject(this.currencyWallet.balance.map(balance => balance.unconfirmed), null);
        this.balanceCurrencyConfirmed = toBehaviourSubject(this.currencyWallet.balance.map(balance => balance.confirmed), null);

        this.balanceUsdUnconfirmed = toBehaviourSubject(combineLatest(
          this.balanceCurrencyUnconfirmed,
          this.currencyInfo.rate,
          (balance, rate) => {
            if (rate === null || balance === null) {
              return null;
            }
            return balance * rate;
          }), null);

        this.balanceUsdConfirmed = toBehaviourSubject(combineLatest(
          this.balanceCurrencyConfirmed,
          this.currencyInfo.rate,
          (balance, rate) => {
            if (rate === null || balance === null) {
              return null;
            }
            return balance * rate;
          }), null);

        this.transactions = toBehaviourSubject(
          fromPromise(this.currencyWallet.listTransactionHistory()),
          []);

        this.subscriptions.push(
          this.currencyWallet.readyEvent.subscribe(() => {
            this.transactions = toBehaviourSubject(
              fromPromise(this.currencyWallet.listTransactionHistory()),
              []);
          })
        );

      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async send() {
    await this.router.navigate(['/navigator', {outlets: {navigator: ['send-transaction', this.currency]}}]);
  }

  copy() {
    cordova.plugins.clipboard.copy(this.walletAddress.value);
  }

  async onSettingsClicked() {
    await this.router.navigate(['/navigator', {outlets: {'navigator': ['currency', this.currency, 'settings']}}]);
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', {outlets: {'navigator': ['wallet']}}]);
  }
}
