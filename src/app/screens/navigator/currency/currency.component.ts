import { animate, style, transition, trigger } from '@angular/animations';
import { Component, HostBinding, Input, OnDestroy, OnInit, HostListener, ViewChild, Inject, AfterViewInit, ChangeDetectorRef, ElementRef, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest, from, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import {
  BalanceStatus, CurrencyWallet, HistoryEntry, Status,
  TransactionType
} from '../../../services/wallet/currencywallet';
import { toBehaviourSubject } from '../../../utils/transformers';
import { CurrencySettingsComponent } from '../currency-settings/currency-settings.component';
import { SendTransactionComponent } from '../send-transaction/send-transaction.component';
import { DeviceService, Platform } from '../../../services/device.service';
import { DOCUMENT } from '@angular/platform-browser';
import * as $ from 'jquery';

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
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public txType = TransactionType;
  public statusType = Status;
  public balanceStatusType = BalanceStatus;
  
  @ViewChild('transactionList') transactionList: ElementRef;

  @Input() public currency: Coin | Token = null;
  public currencyInfo: Info = null;

  public currencyWallet: CurrencyWallet = null;

  public walletAddress: BehaviorSubject<string> = null;
  public balanceCurrencyConfirmed: BehaviorSubject<number> = null;
  public balanceCurrencyUnconfirmed: BehaviorSubject<number> = null;
  public balanceUsdConfirmed: BehaviorSubject<number> = null;
  public balanceUsdUnconfirmed: BehaviorSubject<number> = null;

  public transactions: BehaviorSubject<Array<HistoryEntry>> = null;
  public isLoadingTransactions: boolean = false;
  public isUpdatingTransactions: boolean = false;

  private subscriptions = [];

  private transactionsCount = 0;
  private isHistoryLoaded: boolean = false;
  private step = 10;
  private unconfirmedList: Array<HistoryEntry> = [];
  private isFirstUpdate: boolean = true;
  
  constructor(
    private readonly wallet: WalletService,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService,
    private readonly deviceService: DeviceService,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
  ) {}

  async ngOnInit() {
    $('#transactionList').scroll(() => {    
      if ($('#transactionList').scrollTop() >=  ($('#transactionList')[0].scrollHeight - $('#transactionList').height()) * 0.9 ) {
          this.loadMore();
        }
    });

    this.currencyInfo = await this.currencyService.getInfo(this.currency);

    this.currencyWallet = this.wallet.currencyWallets.get(this.currency);

    this.walletAddress = this.currencyWallet.address;

    this.balanceCurrencyUnconfirmed = toBehaviourSubject(
      this.currencyWallet.balance.pipe(map(balance => balance ? this.currencyWallet.fromInternal(balance.unconfirmed) : null)),
      null);
    this.balanceCurrencyConfirmed = toBehaviourSubject(
      this.currencyWallet.balance.pipe(map(balance => balance ? this.currencyWallet.fromInternal(balance.confirmed) : null)),
      null);

    this.balanceUsdUnconfirmed = toBehaviourSubject(combineLatest([
      this.balanceCurrencyUnconfirmed,
      this.currencyInfo.rate
    ]).pipe(
      map(([balance, rate]) => {
        if (rate === null || balance === null) {
          return null;
        }
        return balance * rate;
      })
    ), null);

    this.balanceUsdConfirmed = toBehaviourSubject(combineLatest([
      this.balanceCurrencyConfirmed,
      this.currencyInfo.rate
    ]).pipe(
      map(([balance, rate]) => {
        if (rate === null || balance === null) {
          return null;
        }
        return balance * rate;
      })
    ), null);

    this.transactions = toBehaviourSubject(
      from(this.currencyWallet.listTransactionHistory(this.step, 0)),
      null);

    this.subscriptions.push(
      this.currencyWallet.readyEvent.subscribe(() => {
        this.transactions = toBehaviourSubject(
          from(this.currencyWallet.listTransactionHistory(this.step, 0)),
          null);
      })
    );

    this.transactionsCount += this.step;

    interval(10000).subscribe(async () => {
      await this.updateTransactions();
    });
  }

  async loadMore() {
    if (!this.isHistoryLoaded && !this.isLoadingTransactions) {
      this.isLoadingTransactions = true;

      let newList = await this.currencyWallet.listTransactionHistory(this.transactionsCount + this.step, this.transactionsCount);
      let oldList = this.transactions.getValue();

      if (newList.length > 0) {
        oldList.push.apply(oldList, newList);

        let unconfirmed = newList.filter(item => item.confirmed === false);
        this.unconfirmedList.push.apply(this.unconfirmedList, unconfirmed);
      }
      if (newList.length < this.step) {
        this.currencyWallet.isHistoryLoaded = true;
        this.isHistoryLoaded = true;
        console.log("History loaded!");
      }

      this.transactions.next(oldList);

      this.transactionsCount += this.step;

      this.isLoadingTransactions = false;
    }
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
    return this.deviceService.platform === Platform.Windows;
  }

  async onSettingsClicked() {
    const componentRef = this.navigationService.pushOverlay(CurrencySettingsComponent);
    componentRef.instance.currency = this.currency;
  }

  async onBack() {
    this.navigationService.back();
  }

  async updateTransactions(to=this.step, from=0) {
    if (this.currencyWallet !== null && this.transactions.getValue() !== null && !this.isUpdatingTransactions && !this.isLoadingTransactions) {
      this.isUpdatingTransactions = true;

      if (this.isFirstUpdate) {
        let unconfirmed = this.transactions.getValue().filter(item => item.confirmed === false);
        this.unconfirmedList.push.apply(this.unconfirmedList, unconfirmed);
        this.isFirstUpdate = false;
      }

      let newList = await this.currencyWallet.listTransactionHistory(to, from);   

      if (newList !== null && newList.length > 0) {
        this.checkUnconfirmed(newList);

        let oldList = this.transactions.getValue();

        if (newList.slice(-1)[0].time <= oldList[0].time) {
          let timeEnd = oldList[0].time;
          let filtered = newList.filter(item => (item.confirmed && item.time > timeEnd || !item.confirmed && this.transactionHashNotInList(item.blockhash)));

          oldList.unshift.apply(oldList, filtered);
          this.transactions.next(oldList);

          let unconfirmed = filtered.filter(item => item.confirmed === false);
          this.unconfirmedList.unshift.apply(this.unconfirmedList, unconfirmed);
        } else {
          oldList.unshift.apply(oldList, newList);
          this.transactions.next(oldList);

          let unconfirmed = newList.filter(item => item.confirmed === false);
          this.unconfirmedList.unshift.apply(this.unconfirmedList, unconfirmed);

          this.updateTransactions(to + this.step, from + this.step);
        }
      }
      
      this.isUpdatingTransactions = false;
    }
  }

  public transactionHashNotInList(blockhash: string) : boolean {
    let transactionsList = this.transactions.getValue();
    for (var i = 0; i < transactionsList.length; i++)
      if (transactionsList[i].blockhash === blockhash)
        return false;

    return true;
  }

  public checkUnconfirmed(newList: Array<HistoryEntry>): void {
    if (this.unconfirmedList.length > 0) {
      let oldList = this.transactions.getValue();
      let confirmedList = newList.filter(item => item.confirmed === true);
      for (let confirmed of confirmedList) {
        let unconfirmed = this.unconfirmedList.filter(item => item.blockhash === confirmed.blockhash);
        if (unconfirmed.length > 0) {
          let unconfirmedEntity = unconfirmed[0];
          this.unconfirmedList.splice(this.unconfirmedList.indexOf(unconfirmedEntity), 1);

          let confirmedEntity = oldList.filter(item => item.blockhash === confirmed.blockhash)[0];
          confirmedEntity.confirmed = true;
          confirmedEntity.time = confirmed.time;
        }
      }
      this.transactions.next(oldList);
    }
  }
}
