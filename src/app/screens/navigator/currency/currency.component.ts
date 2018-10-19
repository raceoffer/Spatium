import { animate, style, transition, trigger } from '@angular/animations';
import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { BigNumber } from 'bignumber.js';
import { BehaviorSubject, combineLatest, interval, timer } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { BalanceService, BalanceStatus } from '../../../services/balance.service';
import { CurrencyInfoService } from '../../../services/currencyinfo.service';
import { DeviceService, Platform } from '../../../services/device.service';
import { NavigationService } from '../../../services/navigation.service';
import { PriceService } from '../../../services/price.service';
import { SyncService } from '../../../services/sync.service';
import { HistoryBlock, TransactionService } from '../../../services/transaction.service';
import { CurrecnyModelType, CurrencyModel, SyncState, Wallet } from '../../../services/wallet/wallet';
import { toBehaviourSubject } from '../../../utils/transformers';
import { uuidFrom } from '../../../utils/uuid';
import { CurrencySettingsComponent } from '../currency-settings/currency-settings.component';
import { SendTransactionComponent } from '../send-transaction/send-transaction.component';

export enum TransactionType {
  In,
  Out,
  Self
}

export class HistoryEntry {
  constructor(public type: TransactionType,
              public from: string,
              public to: string,
              public amount: any,
              public fee: any,
              public confirmed: boolean,
              public time: number,
              public hash: string) {}

  static fromJSON(json) {
    const type = ((t) => {
      switch (t) {
        case 'In':
          return TransactionType.In;
        case 'Out':
          return TransactionType.Out;
        case 'Self':
          return TransactionType.Self;
      }
    })(json.type);

    return new HistoryEntry(
      type,
      json.from,
      json.to,
      json.amount,
      json.fee,
      json.confirmed,
      json.time,
      json.hash
    );
  }
}

declare const cordova: any;

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss'],
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

  public balanceUnconfirmed: BehaviorSubject<BigNumber>;
  public balanceConfirmed: BehaviorSubject<BigNumber>;
  public balanceUSDUnconfirmed: BehaviorSubject<BigNumber>;
  public balanceUSDConfirmed: BehaviorSubject<BigNumber>;

  public transactions: BehaviorSubject<HistoryBlock> = new BehaviorSubject<HistoryBlock>(new HistoryBlock([]));
  public isLoadingTransactions: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isLoadingMoreTransactions: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private transactionWatcherId = '';
  private transactionWatcher: any = null;
  private subscriptions = [];
  private isFirstInView = true;


  constructor(private readonly navigationService: NavigationService,
              private readonly deviceService: DeviceService,
              private readonly currencyInfoService: CurrencyInfoService,
              private readonly syncService: SyncService,
              private readonly balanceService: BalanceService,
              private readonly transactionService: TransactionService,
              private readonly priceService: PriceService) {}

  async ngOnInit() {
    this.wallet = new Wallet(this.model, this.syncService, this.balanceService, this.currencyInfoService);

    switch (this.model.type) {
      case CurrecnyModelType.Coin: {
        this.transactionWatcherId = uuidFrom(this.model.currencyInfo.id.toString());
        break;
      }
      case CurrecnyModelType.Token: {
        this.transactionWatcherId = uuidFrom(this.model.currencyInfo.id.toString() + this.model.tokenInfo.id.toString());
        break;
      }
    }

    if (!this.transactionService.hasWatcher(this.transactionWatcherId)) {
      this.transactionWatcher = this.transactionService.registerWatcher(this.transactionWatcherId, this.wallet);
    } else {
      this.transactionWatcher = this.transactionService.watcher(this.transactionWatcherId);
    }
    this.transactions = this.transactionWatcher.cachedTransactions;
    this.isLoadingTransactions = this.transactionWatcher.isLoadingLastTransactions;
    this.isLoadingMoreTransactions = this.transactionWatcher.isLoadingMoreTransactions;

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
      map((balanceUnconfirmed) => balanceUnconfirmed !== null ? balanceUnconfirmed.times(this.priceService.price(this.model.ticker)) : null)
    ), null);

    this.balanceUSDConfirmed = toBehaviourSubject(this.balanceConfirmed.pipe(
      map((balanceConfirmed) => balanceConfirmed !== null ? balanceConfirmed.times(this.priceService.price(this.model.ticker)) : null)
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
        if (!this.transactionWatcher.hasTransactions()) {
          await this.transactionWatcher.loadLastPageTransactions();
        }
      })
    );

    this.subscriptions.push(
      interval(10000).subscribe(async () => {
        if (this.isFirstInView) {
          await this.transactionWatcher.updateTransactions();
        }
      })
    );
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
      await this.transactionWatcher.loadMoreTransactions();
    }
  }

  onInViewportChange(inViewport: boolean, index) {
    if (index === 0) {
      this.isFirstInView = inViewport;
    }
  }
}
