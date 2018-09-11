import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, HostBinding, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import * as $ from 'jquery';
import { BehaviorSubject, of, timer, from, interval } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';
import { DeviceService, Platform } from '../../../services/device.service';
import { NavigationService } from '../../../services/navigation.service';
import { toBehaviourSubject } from '../../../utils/transformers';
import { CurrencySettingsComponent } from '../currency-settings/currency-settings.component';
import { SendTransactionComponent } from '../send-transaction/send-transaction.component';
import { Tile, TileType } from '../../../elements/tile-coin/tile-coin.component';
import { SyncState, Currency } from '../../../services/verifier.service';
import { BalanceStatus, BalanceService, Balance } from '../../../services/balance.service';
import { CurrencyInfoService, ApiServer } from '../../../services/currencyinfo.service';
import { SyncService } from '../../../services/sync.service';
import { PriceService } from '../../../services/price.service';
import { uuidFrom } from '../../../utils/uuid';

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

  @ViewChild('transactionList') transactionList: ElementRef;

  @Input() public tile: Tile = null;

  public model: {
    name: string,
    ticker: string
  } = null;

  public currency: BehaviorSubject<Currency>;
  public state: BehaviorSubject<SyncState>;
  public balanceWatcher: BehaviorSubject<{
    id: string,
    balanceSubject: BehaviorSubject<Balance>,
    statusSubject: BehaviorSubject<BalanceStatus>,
    wallet: any
  }>;
  public address: BehaviorSubject<string>;
  public balanceUnconfirmed: BehaviorSubject<number>;
  public balanceConfirmed: BehaviorSubject<number>;
  public balanceUSDUnconfirmed: BehaviorSubject<number>;
  public balanceUSDConfirmed: BehaviorSubject<number>;
  public balanceStatus: BehaviorSubject<BalanceStatus>;

  // public transactionArray = [];
  // public transactions: BehaviorSubject<Array<HistoryEntry>> = null;
  // public isLoadingTransactions = false;
  // public isUpdatingTransactions = false;
  // public timeEnd = null;

  // private transactionsCount = 0;
  // private isHistoryLoaded = false;
  // private step = 10;
  // private unconfirmedList: Array<HistoryEntry> = [];
  // private isFirstUpdate = true;

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
    switch (this.tile.type) {
      case TileType.Coin:
        this.model = {
          name: this.tile.currencyInfo.name,
          ticker: this.tile.currencyInfo.ticker
        };
        break;
      case TileType.Token:
        this.model = {
          name: this.tile.tokenInfo.name,
          ticker: this.tile.tokenInfo.ticker
        };
        break;
    }

    // $('#transactionList').scroll(() => {
    //   if ($('#transactionList').scrollTop() >=  ($('#transactionList')[0].scrollHeight - $('#transactionList').height()) * 0.9 ) {
    //       this.loadMore();
    //     }
    // });

    this.currency = toBehaviourSubject(this.syncService.currencyEvent.pipe(
      filter(currencyId => currencyId === this.tile.currencyInfo.id),
      map(currencyId => this.syncService.currency(currencyId))
    ), this.syncService.currency(this.tile.currencyInfo.id));

    this.state = toBehaviourSubject(this.currency.pipe(
      mergeMap(currency => currency ? currency.state : of(SyncState.None))
    ), SyncState.None);

    this.balanceWatcher = toBehaviourSubject(this.state.pipe(
      filter(state => state === SyncState.Finalized),
      mergeMap(async () => {
        let watcherId;

        const network = this.tile.currencyInfo.network;
        const endpoint = this.currencyInfoService.apiServer(this.tile.currencyInfo.id, ApiServer.Spatium);
        const point = await this.currency.getValue().compoundPublic();

        switch (this.tile.type) {
          case TileType.Coin:
            watcherId = uuidFrom(this.tile.currencyInfo.id.toString());
            if (!this.balanceService.hasWatcher(watcherId)) {
              const currencyWallet = this.tile.currencyInfo.walletType.fromOptions({
                network,
                point,
                endpoint
              });

              this.balanceService.registerWatcher(watcherId, currencyWallet);
              this.balanceService.forceCurrency(watcherId);
            }
            break;
          case TileType.Token:
            watcherId = uuidFrom(this.tile.currencyInfo.id.toString() + this.tile.tokenInfo.id.toString());
            if (!this.balanceService.hasWatcher(watcherId)) {
              const tokenWallet = this.tile.currencyInfo.tokenWalletType.fromOptions({
                network,
                point,
                endpoint,
                contractAddress: this.tile.tokenInfo.id,
                decimals: this.tile.tokenInfo.decimals
              });

              this.balanceService.registerWatcher(watcherId, tokenWallet);
            }
            break;
        }

        return this.balanceService.watcher(watcherId);
      })
    ), null);

    this.address = toBehaviourSubject(this.balanceWatcher.pipe(
      map(watcher => watcher ? watcher.wallet.address : null)
    ), null);

    this.balanceUnconfirmed = toBehaviourSubject(this.balanceWatcher.pipe(
      mergeMap(watcher => {
        return watcher
          ? watcher.balanceSubject.pipe(map(balance => balance ? watcher.wallet.fromInternal(balance.unconfirmed) : null))
          : of(null);
      })
    ), null);

    this.balanceUSDUnconfirmed = toBehaviourSubject(this.balanceUnconfirmed.pipe(
      map((balanceUnconfirmed) => balanceUnconfirmed !== null ? balanceUnconfirmed * this.priceService.price(this.model.ticker) : null)
    ), null);

    this.balanceConfirmed = toBehaviourSubject(this.balanceWatcher.pipe(
      mergeMap(watcher => {
        return watcher
          ? watcher.balanceSubject.pipe(map(balance => balance ? watcher.wallet.fromInternal(balance.confirmed) : null))
          : of(null);
      })
    ), null);

    this.balanceUSDConfirmed = toBehaviourSubject(this.balanceConfirmed.pipe(
      map((balanceConfirmed) => balanceConfirmed !== null ? balanceConfirmed * this.priceService.price(this.model.ticker) : null)
    ), null);

    this.balanceStatus = toBehaviourSubject(this.balanceWatcher.pipe(
      mergeMap(watcher => watcher ? watcher.statusSubject : of(BalanceStatus.None))
    ), BalanceStatus.None);

    this.subscriptions.push(
      timer(0, 3000).subscribe(() => {
        const watcher = this.balanceWatcher.getValue();
        if (watcher) {
          this.balanceService.forceCurrency(watcher.id);
        }
      })
    );

    this.syncService.forceCurrency(this.tile.currencyInfo.id);

    /** @todo Refactor the stuff below */

    // this.transactions = toBehaviourSubject(this.balanceWatcher.pipe(
    //   mergeMap(async () => {
    //     return await this.listTransactionHistory(this.step, 0);
    //   })
    // ), null);

    // this.transactionsCount += this.step;

    // interval(10000).subscribe(async () => {
    //   await this.updateTransactions();
    // });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  send() {
    const overalyRef = this.navigationService.pushOverlay(SendTransactionComponent);
    overalyRef.instance.tile = this.tile;
  }

  copy() {
    cordova.plugins.clipboard.copy(this.address.getValue());
  }

  isWindows(): boolean {
    return this.deviceService.platform === Platform.Windows;
  }

  async onSettingsClicked() {
    const componentRef = this.navigationService.pushOverlay(CurrencySettingsComponent);
    componentRef.instance.tile = this.tile;
  }

  async onBack() {
    this.navigationService.back();
  }

  /** @todo Refactor the stuff below */

  // public async listTransactionHistory(listTo, listFrom) {
  //   const wallet = this.balanceWatcher.getValue() ? this.balanceWatcher.getValue().wallet : null;
  //   if (wallet === null) {
  //     return null;
  //   }

  //   if (this.transactionArray !== null) {
  //     console.log('cached: ' + this.transactionArray.length);
  //   }

  //   if (this.transactionArray === null) {
  //     const txs = await wallet.getTransactions(listTo, listFrom);
  //     const txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));

  //     this.transactionArray = txsMapped;
  //   } else if (listFrom === 0) {
  //     const txs = await wallet.getTransactions(listTo, listFrom);
  //     const txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));

  //     if (txsMapped.length > 0) {
  //       if (txsMapped.slice(-1)[0].time <= this.transactionArray[0].time) {
  //         const timeEnd = this.transactionArray[0].time;
  //         const filtered = txsMapped.filter(item =>
  //           (item.confirmed && item.time > timeEnd || !item.confirmed && this.transactionHashNotInList(item.blockhash))
  //         );

  //         this.transactionArray.unshift.apply(this.transactionArray, filtered);
  //       } else {
  //         this.timeEnd = this.transactionArray[0].time;
  //         this.transactionArray.unshift.apply(this.transactionArray, txsMapped);
  //       }
  //     }
  //   } else {
  //     if (this.timeEnd !== null) {
  //       const txs = await wallet.getTransactions(listTo, listFrom);
  //       const txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));

  //       if (txsMapped.slice(-1)[0].time <= this.transactionArray[0].time) {
  //         const timeEnd = this.transactionArray[0].time;
  //         const filtered = txsMapped.filter(item =>
  //           (item.confirmed && item.time > timeEnd || !item.confirmed && this.transactionHashNotInList(item.blockhash))
  //         );

  //         Array.prototype.splice.apply(this.transactionArray, [listTo, 0].concat(filtered));
  //         this.timeEnd = null;
  //       } else {
  //         Array.prototype.splice.apply(this.transactionArray, [listTo, 0].concat(txsMapped));
  //       }
  //     } else if (this.transactionArray.length < listTo && !this.isHistoryLoaded) {
  //       const txs = await wallet.getTransactions(listTo, listFrom);
  //       const txsMapped = txs.map(tx => HistoryEntry.fromJSON(tx));
  //       const filtered = txsMapped.filter(item => (this.transactionHashNotInList(item.blockhash)));
  //       this.transactionArray.push.apply(this.transactionArray, filtered);
  //     }
  //   }

  //   if (this.transactionArray.length >= listTo) {
  //     return this.transactionArray.slice(listFrom, listTo);
  //   } else {
  //     return this.transactionArray.slice(listFrom);
  //   }
  // }

  // async loadMore() {
  //   if (!this.isHistoryLoaded && !this.isLoadingTransactions) {
  //     this.isLoadingTransactions = true;

  //     const newList = await this.listTransactionHistory(this.transactionsCount + this.step, this.transactionsCount);
  //     const oldList = this.transactions.getValue();

  //     if (newList.length > 0) {
  //       oldList.push.apply(oldList, newList);

  //       const unconfirmed = newList.filter(item => item.confirmed === false);
  //       this.unconfirmedList.push.apply(this.unconfirmedList, unconfirmed);
  //     }
  //     if (newList.length < this.step) {
  //       this.isHistoryLoaded = true;
  //       console.log('History loaded!');
  //     }

  //     this.transactions.next(oldList);

  //     this.transactionsCount += this.step;

  //     this.isLoadingTransactions = false;
  //   }
  // }

  // async updateTransactions(listTo = this.step, listFrom = 0) {
  //   const wallet = this.balanceWatcher.getValue() ? this.balanceWatcher.getValue().wallet : null;
  //   if (wallet !== null &&
  //       this.transactions.getValue() !== null &&
  //       !this.isUpdatingTransactions &&
  //       !this.isLoadingTransactions
  //   ) {
  //     this.isUpdatingTransactions = true;

  //     if (this.isFirstUpdate) {
  //       const unconfirmed = this.transactions.getValue().filter(item => item.confirmed === false);
  //       this.unconfirmedList.push.apply(this.unconfirmedList, unconfirmed);
  //       this.isFirstUpdate = false;
  //     }

  //     const newList = await this.listTransactionHistory(listTo, listFrom);

  //     if (newList !== null && newList.length > 0) {
  //       this.checkUnconfirmed(newList);

  //       const oldList = this.transactions.getValue();

  //       if (newList.slice(-1)[0].time <= oldList[0].time) {
  //         const timeEnd = oldList[0].time;
  //         const filtered = newList.filter(item =>
  //           (item.confirmed && item.time > timeEnd || !item.confirmed && this.transactionHashNotInList(item.blockhash))
  //         );

  //         oldList.unshift.apply(oldList, filtered);
  //         this.transactions.next(oldList);

  //         const unconfirmed = filtered.filter(item => item.confirmed === false);
  //         this.unconfirmedList.unshift.apply(this.unconfirmedList, unconfirmed);
  //       } else {
  //         oldList.unshift.apply(oldList, newList);
  //         this.transactions.next(oldList);

  //         const unconfirmed = newList.filter(item => item.confirmed === false);
  //         this.unconfirmedList.unshift.apply(this.unconfirmedList, unconfirmed);

  //         this.updateTransactions(listTo + this.step, listFrom + this.step);
  //       }
  //     }

  //     this.isUpdatingTransactions = false;
  //   }
  // }

  // public transactionHashNotInList(blockhash: string): boolean {
  //   const transactionsList = this.transactions.getValue();
  //   for (let i = 0; i < transactionsList.length; i++) {
  //     if (transactionsList[i].blockhash === blockhash) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  // public checkUnconfirmed(newList: Array<HistoryEntry>): void {
  //   if (this.unconfirmedList.length > 0) {
  //     const oldList = this.transactions.getValue();
  //     const confirmedList = newList.filter(item => item.confirmed === true);
  //     for (const confirmed of confirmedList) {
  //       const unconfirmed = this.unconfirmedList.filter(item => item.blockhash === confirmed.blockhash);
  //       if (unconfirmed.length > 0) {
  //         const unconfirmedEntity = unconfirmed[0];
  //         this.unconfirmedList.splice(this.unconfirmedList.indexOf(unconfirmedEntity), 1);

  //         const confirmedEntity = oldList.filter(item => item.blockhash === confirmed.blockhash)[0];
  //         confirmedEntity.confirmed = true;
  //         confirmedEntity.time = confirmed.time;
  //       }
  //     }
  //     this.transactions.next(oldList);
  //   }
  // }
}
