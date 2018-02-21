import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { WalletService } from '../../../services/wallet.service';
import { Observable } from 'rxjs/Observable';
import { CurrencyWallet, HistoryEntry, TransactionType } from '../../../services/wallet/currencywallet';
import { Coin } from '../../../services/keychain.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const bcoin: any;

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit, OnDestroy {
  public usdTitle = 'USD';

  public txType = TransactionType;

  public selectedAddress: string = null;

  public currencyWallet: CurrencyWallet;

  public walletAddress: Observable<string>;
  public balanceCurrencyConfirmed: Observable<number>;
  public balanceCurrencyUnconfirmed: Observable<number>;
  public balanceUsdConfirmed: Observable<number>;
  public balanceUsdUnconfirmed: Observable<number>;
  public transactions: Observable<Array<HistoryEntry>>;

  public currencySymbol: BehaviorSubject<string> = new BehaviorSubject('');
  public currencyTitle: BehaviorSubject<string> = new BehaviorSubject('');

  public rateBtcUsd = 15000;

  public accountLabel = 'Account';
  public sendLabel = 'Send';

  private subscriptions = [];

  private coin: Coin = null;

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
    private readonly wallet: WalletService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((params: Params) => {
        this.coin = Number(params['coin']) as Coin;

        switch (this.coin) {
          case Coin.BTC:
            this.currencyTitle.next('Bitcoin');
            this.currencySymbol.next('BTC');
            break;
          case Coin.BCH:
            this.currencyTitle.next('Bitcoin Cash');
            this.currencySymbol.next('BCH');
            break;
          case Coin.ETH:
            this.currencyTitle.next('Ethereum');
            this.currencySymbol.next('ETH');
            break;
        }

        this.currencyWallet = this.wallet.currencyWallets.get(this.coin);

        this.walletAddress = this.currencyWallet.address;
        this.balanceCurrencyUnconfirmed = this.currencyWallet.balance.map(balance => balance.unconfirmed);
        this.balanceCurrencyConfirmed = this.currencyWallet.balance.map(balance => balance.confirmed);
        this.balanceUsdUnconfirmed = this.balanceCurrencyUnconfirmed.map(balance => balance * this.rateBtcUsd);
        this.balanceUsdConfirmed = this.balanceCurrencyConfirmed.map(balance => balance * this.rateBtcUsd);
        this.transactions = this.currencyWallet.transactions.map(transactions => transactions.sort(CurrencyComponent.compareTransactions));

        this.subscriptions.push(this.currencyWallet.transactions.subscribe(txs => {
          console.log(txs);
        }));

        this.subscriptions.push(
          this.walletAddress.subscribe(address => {
            this.selectedAddress = address;
          })
        );
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async send() {
    await this.router.navigate(['/navigator', { outlets: { navigator: ['send-transaction', this.coin] } }]);
  }
}
