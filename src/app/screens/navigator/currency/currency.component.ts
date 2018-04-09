import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { WalletService } from '../../../services/wallet.service';
import { Observable } from 'rxjs/Observable';
import { CurrencyWallet, HistoryEntry, TransactionType } from '../../../services/wallet/currencywallet';
import { Coin, Token } from '../../../services/keychain.service';
import { CurrencyService, Info } from '../../../services/currency.service';
import { NavigationService } from '../../../services/navigation.service';
import { toBehaviourSubject } from '../../../utils/transformers';
import { combineLatest } from 'rxjs/observable/combineLatest';

declare const device: any;

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit, OnDestroy {
  public usdTitle = 'USD';

  public txType = TransactionType;

  public currency: Coin | Token = null;
  public currencyInfo: Info = null;

  public currencyWallet: CurrencyWallet = null;

  public walletAddress: Observable<string> = null;
  public balanceCurrencyConfirmed: Observable<number> = null;
  public balanceCurrencyUnconfirmed: Observable<number> = null;
  public balanceUsdConfirmed: Observable<number> = null;
  public balanceUsdUnconfirmed: Observable<number> = null;
  public transactions: Observable<Array<HistoryEntry>> = null;

  public accountLabel = 'Account';
  public sendLabel = 'Send';

  private subscriptions = [];

  private static compareTransactions(a, b) {
    // First unconfirmed transactions
    if (!a.confirmed && !b.confirmed) {
      return 0;
    }

    if (!a.confirmed && b.confirmed) {
      return -1;
    }

    if (a.confirmed && !b.confirmed) {
      return 1;
    }

    // then confirmed transactions sorted by time
    if (a.time > b.time) {
      return -1;
    }

    if (a.time < b.time) {
      return 1;
    }

    return 0;
  }

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService
  ) {  }

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

        this.currencyWallet = this.wallet.currencyWallets.get(this.currency);

        this.walletAddress = this.currencyWallet.address;
        this.balanceCurrencyUnconfirmed = toBehaviourSubject(this.currencyWallet.balance.map(balance => balance.unconfirmed), 0);
        this.balanceCurrencyConfirmed = toBehaviourSubject(this.currencyWallet.balance.map(balance => balance.confirmed), 0);

        this.balanceUsdUnconfirmed = toBehaviourSubject(combineLatest(
          this.balanceCurrencyUnconfirmed,
          this.currencyInfo.rate,
          (balance, rate) => {
            if (rate === null) {
              return null;
            }
            return balance * rate;
          }), 0);

        this.balanceUsdConfirmed = toBehaviourSubject(combineLatest(
          this.balanceCurrencyConfirmed,
          this.currencyInfo.rate,
          (balance, rate) => {
            if (rate === null) {
              return null;
            }
            return balance * rate;
          }), 0);

        this.transactions = toBehaviourSubject(
          this.currencyWallet.transactions.map(transactions => transactions.sort(CurrencyComponent.compareTransactions)),
          []);
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async send() {
    await this.router.navigate(['/navigator', { outlets: { navigator: ['send-transaction', this.currency] } }]);
  }

  async onBackClicked() {
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['wallet'] } }]);
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }
}
