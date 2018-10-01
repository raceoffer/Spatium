import { animate, style, transition, trigger } from '@angular/animations';
import { Component, HostBinding, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { BehaviorSubject, timer, combineLatest } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';
import { DeviceService, Platform } from '../../../services/device.service';
import { NavigationService } from '../../../services/navigation.service';
import { toBehaviourSubject } from '../../../utils/transformers';
import { CurrencySettingsComponent } from '../currency-settings/currency-settings.component';
import { SendTransactionComponent } from '../send-transaction/send-transaction.component';
import { BalanceStatus, BalanceService } from '../../../services/balance.service';
import { CurrencyInfoService } from '../../../services/currencyinfo.service';
import { SyncService } from '../../../services/sync.service';
import { PriceService } from '../../../services/price.service';
import { CurrencyModel, Wallet, SyncState } from '../../../services/wallet/wallet';

export enum TransactionType {
  In,
  Out
}

export class HistoryEntry {
  constructor(public type: TransactionType,
              // tslint:disable-next-line:no-shadowed-variable
              public from: string,
              public to: string,
              public amount: number,
              public confirmed: boolean,
              public time: number,
              public blockhash: string) {}

  static fromJSON(json) {
    return new HistoryEntry(
      json.type === 'Out' ? TransactionType.Out : TransactionType.In,
      json.from,
      json.to,
      json.amount,
      json.confirmed,
      json.time,
      json.blockhash
    );
  }
}

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
  public stateType = SyncState;
  public balanceStatusType = BalanceStatus;

  @Input() public model: CurrencyModel = null;

  public wallet: Wallet;
  public synchronizing = this.syncService.synchronizing;

  public balanceUnconfirmed: BehaviorSubject<number>;
  public balanceConfirmed: BehaviorSubject<number>;
  public balanceUSDUnconfirmed: BehaviorSubject<number>;
  public balanceUSDConfirmed: BehaviorSubject<number>;

  public transactions: Array<HistoryEntry> = [];
  public isLoadingTransactions = false;
  private step = 10;

  private subscriptions = [];

  constructor(
    private readonly navigationService: NavigationService,
    private readonly deviceService: DeviceService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService,
    private readonly balanceService: BalanceService,
    private readonly priceService: PriceService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  async ngOnInit() {
    this.wallet = new Wallet(this.model, this.syncService, this.balanceService, this.currencyInfoService);

    this.balanceUnconfirmed = toBehaviourSubject(combineLatest([
      this.wallet.balanceUnconfirmed,
      this.wallet.wallet
    ]).pipe(
      map(([balanceUnconfirmed, wallet]) => balanceUnconfirmed ? wallet.fromInternal(balanceUnconfirmed) : null)
    ), null);

    this.balanceConfirmed = toBehaviourSubject(combineLatest([
      this.wallet.balanceConfirmed,
      this.wallet.wallet
    ]).pipe(
      map(([balanceConfirmed, wallet]) => balanceConfirmed ? wallet.fromInternal(balanceConfirmed) : null)
    ), null);

    this.balanceUSDUnconfirmed = toBehaviourSubject(this.balanceUnconfirmed.pipe(
      map((balanceUnconfirmed) => balanceUnconfirmed !== null ? balanceUnconfirmed * this.priceService.price(this.model.ticker) : null)
    ), null);

    this.balanceUSDConfirmed = toBehaviourSubject(this.balanceConfirmed.pipe(
      map((balanceConfirmed) => balanceConfirmed !== null ? balanceConfirmed * this.priceService.price(this.model.ticker) : null)
    ), null);

    this.subscriptions.push(
      timer(0, 3000).pipe(
        mergeMap(() => this.wallet.balanceWatcher),
        filter(watcher => !!watcher)
      ).subscribe((watcher) => {
        this.balanceService.forceCurrency(watcher.id);
      })
    );

    this.syncService.forceCurrency(this.model.currencyInfo.id);

    // get transaction history
    this.subscriptions.push(
      this.wallet.wallet.pipe(
        filter(wallet => !!wallet)
      ).subscribe(async wallet => {
        this.isLoadingTransactions = true;
        try {
          const transactions = await wallet.getTransactions(this.step, 0);
          this.transactions = transactions.map(tx => HistoryEntry.fromJSON(tx));
        } finally {
          this.isLoadingTransactions = false;
        }
    }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  send() {
    const overalyRef = this.navigationService.pushOverlay(SendTransactionComponent);
    overalyRef.instance.model = this.model;
  }

  copy() {
    cordova.plugins.clipboard.copy(this.wallet.address.getValue());
  }

  isWindows(): boolean {
    return this.deviceService.platform === Platform.Windows;
  }

  async onSettingsClicked() {
    const componentRef = this.navigationService.pushOverlay(CurrencySettingsComponent);
    componentRef.instance.currencyId = this.model.currencyInfo.id;
    componentRef.instance.saved.subscribe(() => {
      this.navigationService.acceptOverlay();
    });
  }

  async onBack() {
    this.navigationService.back();
  }

  public async onScroll(percent: number) {
    if (percent >= 90) {
      await this.loadMore();
    }
  }

  async loadMore() {
    if (this.isLoadingTransactions) {
      return;
    }

    // get transaction history
    const wallet = this.wallet.wallet.getValue();
    this.isLoadingTransactions = true;
    try {
      const oldTransactions = (await wallet.getTransactions(this.transactions.length + this.step, this.transactions.length))
        .map(tx => HistoryEntry.fromJSON(tx));
      oldTransactions.forEach((oldTransaction: HistoryEntry) => this.transactions.push(oldTransaction));
    } finally {
      this.isLoadingTransactions = false;
    }

  }
}
