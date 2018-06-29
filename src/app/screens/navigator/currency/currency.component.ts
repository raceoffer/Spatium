import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import {
  animate, transition, trigger, style
} from '@angular/animations';
import { BehaviorSubject, combineLatest, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { CurrencyWallet, HistoryEntry, TransactionType } from '../../../services/wallet/currencywallet';
import { toBehaviourSubject } from '../../../utils/transformers';
import { SendTransactionComponent } from "../send-transaction/send-transaction.component";
import {Router} from '@angular/router';
import { CurrencySettingsComponent } from "../currency-settings/currency-settings.component";
import {SettingsComponent} from '../settings/settings.component';

declare const cordova: any;
declare const device: any;

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
  @HostBinding('class') classes = 'toolbars-component overlay-background';
  public usdTitle = 'USD';

  public txType = TransactionType;

  @Input() public currency: Coin | Token = null;
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

  constructor(
    private readonly wallet: WalletService,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService
  ) {}

  async ngOnInit() {
    this.currencyInfo = await this.currencyService.getInfo(this.currency);

    this.currencyWallet = this.wallet.currencyWallets.get(this.currency);

    this.walletAddress = this.currencyWallet.address;

    this.balanceCurrencyUnconfirmed = toBehaviourSubject(
      this.currencyWallet.balance.pipe(map(balance => balance ? this.currencyWallet.fromInternal(balance.unconfirmed) : null)),
      null);
    this.balanceCurrencyConfirmed = toBehaviourSubject(
      this.currencyWallet.balance.pipe(map(balance => balance ? this.currencyWallet.fromInternal(balance.confirmed) : null)),
      null);

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
      from(this.currencyWallet.listTransactionHistory()),
      null);

    this.subscriptions.push(
      this.currencyWallet.readyEvent.subscribe(() => {
        this.transactions = toBehaviourSubject(
          from(this.currencyWallet.listTransactionHistory()),
          null);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  send() {
    const overalyRef = this.navigationService.pushOverlay(SendTransactionComponent);
    overalyRef.instance.currency = this.currency;
  }

  copy() {
    cordova.plugins.clipboard.copy(this.walletAddress.value);
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }

  async onSettingsClicked() {
    const componentRef = this.navigationService.pushOverlay(CurrencySettingsComponent);
    componentRef.instance.currency = this.currency;
  }

  async onBack() {
    this.navigationService.back();
  }
}
