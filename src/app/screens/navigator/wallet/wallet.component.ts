import { ChangeDetectionStrategy, Component, HostBinding, OnDestroy } from '@angular/core';
import { combineLatest, BehaviorSubject } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { CurrencyService } from '../../../services/currency.service';
import { DeviceService, Platform } from '../../../services/device.service';
import { Coin, KeyChainService, Token } from '../../../services/keychain.service';
import { NavigationService , Position } from '../../../services/navigation.service';
import { SyncStatus, WalletService } from '../../../services/wallet.service';
import { requestDialog } from '../../../utils/dialog';
import { toBehaviourSubject } from '../../../utils/transformers';
import { CurrencyComponent } from '../currency/currency.component';
import { WaitingComponent } from '../waiting/waiting.component';
import { Router } from '@angular/router';
import { FeedbackComponent } from '../../feedback/feedback.component';
import { SettingsComponent } from '../settings/settings.component';
import { NavbarComponent } from '../../../modals/navbar/navbar.component';
import { FormControl } from '@angular/forms';
import { ConnectionProviderService } from '../../../services/connection-provider';
import { ConnectionState } from '../../../services/primitives/state';

declare const navigator: any;

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public current = 'Wallet';
  public navLinks = [{
    name: 'Wallet',
    clicked: async () => {
      await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
    }
  }, {
    name: 'Exchange'
  }, {
    name: 'ICO',
    class: 'ico',
    clicked: async () => {
      await this.router.navigate(['/navigator', {outlets: {navigator: ['ico']}}]);
    }
  }, {
    name: 'Portfolio Investment'
  }, {
    name: 'Verification'
  }, {
    name: 'Settings',
    clicked: () => {
      this.openSettings();
    }
  }, {
    name: 'Feedback',
    clicked: () => {
      this.openFeedback();
    }
  }, {
    name: 'Exit',
    clicked: async () => {
      await this.router.navigate(['/start']);
    }
  }];

  public statusType = SyncStatus;

  public status = this.wallet.synchronizatonStatus;
  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;

  public connectionState = this.connectionProvider.connectionState;

  public isWindows;

  public cols: any = Math.ceil(window.innerWidth / 350);

  public title = 'Wallet';
  public isSearch = false;

  public staticCoins: Array<Coin|Token> = [
    Coin.BTC,
    Coin.BCH,
    Coin.ETH,
    Coin.LTC,
    Coin.NEM,
    Coin.ADA,
    Coin.NEO,
    Coin.XRP,
    Coin.XLM
  ];

  public tileModel = new Map<Coin | Token, any>();

  public filterControl = new FormControl();

  public tiles = new BehaviorSubject<Array<Coin | Token>>([]);
  public filter = toBehaviourSubject(this.filterControl.valueChanges.pipe(
    debounceTime(300)
  ), '');
  public filteredTiles = toBehaviourSubject(combineLatest([
    this.tiles,
    this.filter
  ]).pipe(
    map(([tiles, filter]) => {
      if (filter.length > 0) {
        return tiles.filter(
          t => {
            const model = this.tileModel.get(t);
            return model.title.toUpperCase().includes(filter.toUpperCase()) ||
                   model.symbols.includes(filter.toUpperCase());
          }
        );
      } else {
        return tiles;
      }
    })
  ), []);

  private subscriptions = [];

  constructor(
    private readonly keychain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly currency: CurrencyService,
    private readonly connectionProvider: ConnectionProviderService,
    private readonly wallet: WalletService,
    private readonly device: DeviceService,
    private readonly router: Router
  ) {
    const tiles = [];

    this.staticCoins.forEach(coin => tiles.push(coin));

    keychain.topTokens.forEach(tokenInfo => tiles.push(tokenInfo.token));

    tiles.push(Coin.BTC_test);

    tiles.forEach(tile => {
      this.tileModel.set(tile, this.getTileModel(tile));
    });

    this.tiles.next(tiles);

    this.isWindows = (this.device.platform === Platform.Windows);

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(() => {
        if (this.isSearch) {
          this.toggleSearch(false);
        }
      })
    );
  }

  public openSettings() {
    this.navigationService.pushOverlay(SettingsComponent);
  }

  public openFeedback() {
    this.navigationService.pushOverlay(FeedbackComponent);
  }

  public toggleNavigation() {
    const componentRef = this.navigationService.pushOverlay(NavbarComponent, Position.Left);
    componentRef.instance.current = this.current;
    componentRef.instance.navLinks = this.navLinks;

    componentRef.instance.clicked.subscribe(async navLink => {
      this.navigationService.acceptOverlay();

      await navLink.clicked();
    });

    componentRef.instance.closed.subscribe(() => {
      this.navigationService.cancelOverlay();
    });
  }

  onResize(): void {
    this.cols = Math.ceil(window.innerWidth / 350);
  }

  public clearFilterValue() {
    this.filterControl.setValue('');
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async onTileClicked(coin: Coin | Token) {
    const componentRef = this.navigationService.pushOverlay(CurrencyComponent);
    componentRef.instance.currency = coin;
  }

  public toggleSearch(value) {
    this.isSearch = value;
    this.clearFilterValue();
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connectedEvent.subscribe(ignored => {
      this.navigationService.acceptOverlay();
    });
  }

  public async onConnect() {
    if (this.connectionState.getValue() !== ConnectionState.None) {
      if (await requestDialog('Syncronize with another device')) {
        await this.openConnectOverlay();
      }
    } else {
      await this.openConnectOverlay();
    }
  }

  public getTileModel(currency: Coin | Token) {
    if (currency === undefined || currency === null) {
      return undefined;
    }

    const currencyInfo = this.currency.getInfo(currency);

    const tileModel: any = {
      title: currencyInfo.name,
      symbols: currencyInfo.symbol,
      logo: currencyInfo.icon,
      coin: currency,
      erc20: currency in Token
    };

    if (this.wallet.currencyWallets.has(currency)) {
      const currencyWallet = this.wallet.currencyWallets.get(currency);

      const balanceUnconfirmed = toBehaviourSubject(
        currencyWallet.balance.pipe(map(balance => balance ? currencyWallet.fromInternal(balance.unconfirmed) : null)),
        null);

      tileModel.implemented = true;
      tileModel.status = currencyWallet.status;
      tileModel.balanceStatus = currencyWallet.balanceStatus;
      tileModel.balance = balanceUnconfirmed;
      tileModel.balanceUSD = toBehaviourSubject(combineLatest([
        balanceUnconfirmed,
        currencyInfo.rate
      ]).pipe(map(
        ([balance, rate]) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }
      )), null);
    }

    return tileModel;
  }
}
