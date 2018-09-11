import { Component, EventEmitter, HostBinding, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { getCurrencyLogo, getTokenLogo } from '../../utils/currency-icon';
import { CurrencyInfo, TokenInfo, CurrencyInfoService, ApiServer } from '../../services/currencyinfo.service';
import { SyncService } from '../../services/sync.service';
import { BehaviorSubject, of } from 'rxjs';
import { SyncState, Currency } from '../../services/verifier.service';
import { BalanceService, Balance, BalanceStatus } from '../../services/balance.service';
import { toBehaviourSubject } from '../../utils/transformers';
import { mergeMap, map, filter } from 'rxjs/operators';
import { PriceService } from '../../services/price.service';
import { uuidFrom } from '../../utils/uuid';

export enum TileType {
  Coin,
  Token
}

export class Tile {
  private constructor(
    private readonly _currencyInfo: CurrencyInfo,
    private readonly _type: TileType,
    private readonly _tokenInfo: TokenInfo
  ) {}

  public get currencyInfo(): CurrencyInfo {
    return this._currencyInfo;
  }

  public get type(): TileType {
    return this._type;
  }

  public get tokenInfo(): TokenInfo {
    return this._tokenInfo;
  }

  public static fromCurrency(currencyInfo: CurrencyInfo) {
    return new Tile(currencyInfo, TileType.Coin, null);
  }

  public static fromToken(currencyInfo: CurrencyInfo, tokenInfo: TokenInfo) {
    return new Tile(currencyInfo, TileType.Token, tokenInfo);
  }
}

@Component({
  selector: 'app-tile-coin',
  templateUrl: './tile-coin.component.html',
  styleUrls: ['./tile-coin.component.css']
})
export class TileCoinComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'tile-coin';

  @Input() tile: Tile = null;

  @Output() clicked: EventEmitter<any> = new EventEmitter<any>();

  public currencyLogo = null;
  public tokenLogo = null;

  public stateType = SyncState;
  public tileType = TileType;
  public balanceStatusType = BalanceStatus;

  public currency: BehaviorSubject<Currency>;
  public state: BehaviorSubject<SyncState>;
  public balanceWatcher: BehaviorSubject<{
    id: string,
    balanceSubject: BehaviorSubject<Balance>,
    statusSubject: BehaviorSubject<BalanceStatus>,
    wallet: any
  }>;
  public balance: BehaviorSubject<number>;
  public balanceUSD: BehaviorSubject<number>;
  public balanceStatus: BehaviorSubject<BalanceStatus>;

  public model: {
    name: string,
    ticker: string,
    logo: string
  } = null;

  private subscriptions = [];

  constructor(
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService,
    private readonly balanceService: BalanceService,
    private readonly priceService: PriceService
  ) {}

  ngOnInit() {
    this.currencyLogo = getCurrencyLogo(this.tile.currencyInfo.id);

    switch (this.tile.type) {
      case TileType.Coin:
        this.model = {
          name: this.tile.currencyInfo.name,
          ticker: this.tile.currencyInfo.ticker,
          logo: this.currencyLogo
        };
        break;
      case TileType.Token:
        this.model = {
          name: this.tile.tokenInfo.name,
          ticker: this.tile.tokenInfo.ticker,
          logo: getTokenLogo(this.tile.currencyInfo.id, this.tile.tokenInfo.id)
        };
        break;
    }

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

    this.balance = toBehaviourSubject(this.balanceWatcher.pipe(
      mergeMap(watcher => {
        return watcher
          ? watcher.balanceSubject.pipe(map(balance => balance ? watcher.wallet.fromInternal(balance.unconfirmed) : null))
          : of(null);
      })
    ), null);

    this.balanceUSD = toBehaviourSubject(this.balance.pipe(
      map((balance) => balance !== null ? balance * this.priceService.price(this.model.ticker) : null)
    ), null);

    this.balanceStatus = toBehaviourSubject(this.balanceWatcher.pipe(
      mergeMap(watcher => watcher ? watcher.statusSubject : of(BalanceStatus.None))
    ), BalanceStatus.None);
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onClick() {
    this.clicked.next(this.tile);
  }
}
