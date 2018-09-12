import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { BalanceService, BalanceStatus } from '../../services/balance.service';
import { CurrencyInfoService } from '../../services/currencyinfo.service';
import { PriceService } from '../../services/price.service';
import { SyncService } from '../../services/sync.service';
import { SyncState } from '../../services/verifier.service';
import { CurrencyModel, CurrecnyModelType, Wallet } from '../../services/wallet/wallet';
import { toBehaviourSubject } from '../../utils/transformers';

@Component({
  selector: 'app-tile-coin',
  templateUrl: './tile-coin.component.html',
  styleUrls: ['./tile-coin.component.css']
})
export class TileCoinComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'tile-coin';

  @Input() model: CurrencyModel = null;

  @Output() clicked: EventEmitter<any> = new EventEmitter<any>();

  public stateType = SyncState;
  public modelType = CurrecnyModelType;
  public balanceStatusType = BalanceStatus;

  public wallet: Wallet;

  public balance: BehaviorSubject<number>;
  public balanceUSD: BehaviorSubject<number>;
  public balanceStatus: BehaviorSubject<BalanceStatus>;

  private subscriptions = [];

  constructor(
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService,
    private readonly balanceService: BalanceService,
    private readonly priceService: PriceService
  ) {}

  ngOnInit() {
    this.wallet = new Wallet(this.model, this.syncService, this.balanceService, this.currencyInfoService);

    this.balance = toBehaviourSubject(combineLatest([
      this.wallet.balanceUnconfirmed,
      this.wallet.wallet
    ]).pipe(
      map(([balanceUnconfirmed, wallet]) => balanceUnconfirmed ? wallet.fromInternal(balanceUnconfirmed) : null)
    ), null);

    this.balanceUSD = toBehaviourSubject(this.balance.pipe(
      map((balance) => balance !== null ? balance * this.priceService.price(this.model.ticker) : null)
    ), null);
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onClick() {
    this.clicked.next(this.model);
  }
}
