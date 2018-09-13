import { SyncService } from '../sync.service';
import { BalanceService, BalanceStatus } from '../balance.service';
import { CurrencyInfoService, ApiServer, CurrencyInfo, TokenInfo } from '../currencyinfo.service';
import { toBehaviourSubject } from '../../utils/transformers';
import { filter, mergeMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { uuidFrom } from '../../utils/uuid';
import { getCurrencyLogo, getTokenLogo } from '../../utils/currency-icon';

export enum CurrecnyModelType {
  Coin,
  Token
}

export enum SyncState {
  None,
  Started,
  Revealed,
  Responded,
  Finalized
}

export class CurrencyModel {
  private _currencyLogo: string;

  private _name: string;
  private _ticker: string;
  private _logo: string;

  public get currencyLogo(): string {
    return this._currencyLogo;
  }

  public get name(): string {
    return this._name;
  }

  public get ticker(): string {
    return this._ticker;
  }

  public get logo(): string {
    return this._logo;
  }

  public get currencyInfo(): CurrencyInfo {
    return this._currencyInfo;
  }

  public get type(): CurrecnyModelType {
    return this._type;
  }

  public get tokenInfo(): TokenInfo {
    return this._tokenInfo;
  }

  private constructor(
    private readonly _currencyInfo: CurrencyInfo,
    private readonly _type: CurrecnyModelType,
    private readonly _tokenInfo: TokenInfo
  ) {
    this._currencyLogo = getCurrencyLogo(this._currencyInfo.id);

    switch (this._type) {
      case CurrecnyModelType.Coin:
        this._name = this._currencyInfo.name;
        this._ticker = this._currencyInfo.ticker;
        this._logo = this._currencyLogo;
        break;
      case CurrecnyModelType.Token:
        this._name = this._tokenInfo.name;
        this._ticker = this._tokenInfo.ticker;
        this._logo = getTokenLogo(this._currencyInfo.id, this._tokenInfo.id);
        break;
    }
  }

  public static fromCoin(currencyInfo: CurrencyInfo) {
    return new CurrencyModel(currencyInfo, CurrecnyModelType.Coin, null);
  }

  public static fromToken(currencyInfo: CurrencyInfo, tokenInfo: TokenInfo) {
    return new CurrencyModel(currencyInfo, CurrecnyModelType.Token, tokenInfo);
  }
}

export class Wallet {
  constructor(
    private readonly model: CurrencyModel,
    private readonly syncService: SyncService,
    private readonly balanceService: BalanceService,
    private readonly currencyInfoService: CurrencyInfoService
  ) {}

  public currency = toBehaviourSubject(this.syncService.currencyEvent.pipe(
    filter((currencyId) => currencyId === this.model.currencyInfo.id),
    map((currencyId) => this.syncService.currency(currencyId))
  ), this.syncService.currency(this.model.currencyInfo.id));

  public state = toBehaviourSubject(this.currency.pipe(
    mergeMap(currency => currency ? currency.state : of(SyncState.None))
  ), SyncState.None);

  public balanceWatcher = toBehaviourSubject(this.state.pipe(
    filter(state => state === SyncState.Finalized),
    mergeMap(async () => {
      let watcherId;

      const network = this.model.currencyInfo.network;
      const endpoint = this.currencyInfoService.apiServer(this.model.currencyInfo.id, ApiServer.Spatium);
      const point = await this.currency.getValue().compoundPublic();

      switch (this.model.type) {
        case CurrecnyModelType.Coin:
          watcherId = uuidFrom(this.model.currencyInfo.id.toString());
          if (!this.balanceService.hasWatcher(watcherId)) {
            const currencyWallet = this.model.currencyInfo.walletType.fromOptions({
              network,
              point,
              endpoint
            });

            this.balanceService.registerWatcher(watcherId, currencyWallet);
            this.balanceService.forceCurrency(watcherId);
          }
          break;
        case CurrecnyModelType.Token:
          watcherId = uuidFrom(this.model.currencyInfo.id.toString() + this.model.tokenInfo.id.toString());
          if (!this.balanceService.hasWatcher(watcherId)) {
            const tokenWallet = this.model.currencyInfo.tokenWalletType.fromOptions({
              network,
              point,
              endpoint,
              contractAddress: this.model.tokenInfo.id,
              decimals: this.model.tokenInfo.decimals
            });

            this.balanceService.registerWatcher(watcherId, tokenWallet);
          }
          break;
      }

      return this.balanceService.watcher(watcherId);
    })
  ), null);

  public wallet = toBehaviourSubject(this.balanceWatcher.pipe(
    map(watcher => watcher ? watcher.wallet : null)
  ), null);

  public address = toBehaviourSubject(this.balanceWatcher.pipe(
    map(watcher => watcher ? watcher.wallet.address : null)
  ), null);

  public balanceUnconfirmed = toBehaviourSubject(this.balanceWatcher.pipe(
    mergeMap(watcher => {
      return watcher
        ? watcher.balanceSubject.pipe(map(balance => balance ? balance.unconfirmed : null))
        : of(null);
    })
  ), null);

  public balanceConfirmed = toBehaviourSubject(this.balanceWatcher.pipe(
    mergeMap(watcher => {
      return watcher
        ? watcher.balanceSubject.pipe(map(balance => balance ? balance.confirmed : null))
        : of(null);
    })
  ), null);

  public balanceStatus = toBehaviourSubject(this.balanceWatcher.pipe(
    mergeMap(watcher => watcher ? watcher.statusSubject : of(BalanceStatus.None))
  ), BalanceStatus.None);
}
