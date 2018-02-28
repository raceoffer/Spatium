import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { WalletService } from '../../../services/wallet.service';
import { Observable } from 'rxjs/Observable';
import { CurrencyWallet, HistoryEntry, TransactionType } from '../../../services/wallet/currencywallet';
import { Coin, Token } from '../../../services/keychain.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CurrencyService, Info } from '../../../services/currency.service';

declare const bcoin: any;

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
    private readonly currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe(async (params: Params) => {
        this.currency = Number(params['coin']) as Coin | Token;
        this.currencyInfo = await this.currencyService.getInfo(this.currency);

        this.currencyWallet = this.wallet.currencyWallets.get(this.currency);

        this.walletAddress = this.currencyWallet.address;
        this.balanceCurrencyUnconfirmed = this.currencyWallet.balance.map(balance => balance.unconfirmed);
        this.balanceCurrencyConfirmed = this.currencyWallet.balance.map(balance => balance.confirmed);
        this.balanceUsdUnconfirmed = this.balanceCurrencyUnconfirmed.map(balance => balance * (this.currencyInfo ? this.currencyInfo.rate : 0));
        this.balanceUsdConfirmed = this.balanceCurrencyConfirmed.map(balance => balance * (this.currencyInfo ? this.currencyInfo.rate : 0));
        this.transactions = this.currencyWallet.transactions.map(transactions => transactions.sort(CurrencyComponent.compareTransactions));
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async send() {
    await this.router.navigate(['/navigator', { outlets: { navigator: ['send-transaction', this.currency] } }]);
  }
}
