import { ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, map } from 'rxjs/operators';
import { NavbarComponent } from '../../../modals/navbar/navbar.component';
import { CurrencyId, CurrencyInfoService } from '../../../services/currencyinfo.service';
import { DeviceService, Platform } from '../../../services/device.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NavigationService, Position } from '../../../services/navigation.service';
import { RPCConnectionService } from '../../../services/rpc/rpc-connection.service';
import { SyncService } from '../../../services/sync.service';
import { CurrencyModel } from '../../../services/wallet/wallet';
import { toBehaviourSubject } from '../../../utils/transformers';
import { FeedbackComponent } from '../../feedback/feedback.component';
import { CurrencyComponent } from '../currency/currency.component';
import { DeviceDiscoveryComponent } from '../device-discovery/device-discovery.component';
import { SettingsComponent } from '../settings/settings.component';
import { WaitingComponent } from '../waiting/waiting.component';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletComponent implements OnInit, OnDestroy {
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
    name: 'ICO <span class="sup">demo</span>',
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

  public isWindows;

  public cols: any = Math.ceil(window.innerWidth / 350);

  public title = 'Wallet';
  public isSearch = false;

  public filterControl = new FormControl();
  public filter = toBehaviourSubject(this.filterControl.valueChanges.pipe(
    debounceTime(300)
  ), '');

  public tiles = new Array<CurrencyModel>();

  public filteredTiles = toBehaviourSubject(this.filter.pipe(
    map((filterValue) => {
      if (filterValue.length > 0) {
        return this.tiles.filter(t => {
          return t.currencyInfo.name.toUpperCase().includes(filterValue.toUpperCase()) ||
                 t.currencyInfo.ticker.toUpperCase().includes(filterValue.toUpperCase());
        });
      } else {
        return this.tiles;
      }
    })
  ), []);

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly deviceService: DeviceService,
    private readonly navigationService: NavigationService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService,
    private readonly keyChainService: KeyChainService,
    private readonly connectionService: RPCConnectionService
  ) {
    this.tiles.push(
      ... [
        CurrencyId.Bitcoin,
        CurrencyId.Litecoin,
        CurrencyId.BitcoinCash,
        CurrencyId.Ethereum,
        CurrencyId.Neo
      ].map((currencyId) => {
        return CurrencyModel.fromCoin(this.currencyInfoService.currencyInfo(currencyId));
      })
    );

    for (const tile of this.tiles.slice(0)) {
      this.tiles.push(
        ... tile.currencyInfo.tokens.map((tokenInfo) => {
          return CurrencyModel.fromToken(tile.currencyInfo, tokenInfo);
        })
      );
    }

    this.tiles.push(
      ... [
        CurrencyId.BitcoinTest,
        CurrencyId.LitecoinTest,
        CurrencyId.BitcoinCashTest,
        CurrencyId.EthereumTest,
        CurrencyId.NeoTest
      ].map((currencyId) => {
        return CurrencyModel.fromCoin(this.currencyInfoService.currencyInfo(currencyId));
      })
    );
  }

  public async ngOnInit() {
    await this.deviceService.deviceReady();

    this.isWindows = (this.deviceService.platform === Platform.Windows);

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(() => {
        if (this.isSearch) {
          this.toggleSearch(false);
        }
      })
    );
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.syncService.cancel();
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

  public onResize() {
    this.cols = Math.ceil(window.innerWidth / 350);
  }

  public clearFilterValue() {
    this.filterControl.setValue('');
  }

  public toggleSearch(value) {
    this.isSearch = value;
    this.clearFilterValue();
  }

  public openCurrencyOverlay(model) {
    const componentRef = this.navigationService.pushOverlay(CurrencyComponent);
    componentRef.instance.model = model;
  }

  public openSettings() {
    this.navigationService.pushOverlay(SettingsComponent);
  }

  public openFeedback() {
    this.navigationService.pushOverlay(FeedbackComponent);
  }

  public async openConnectOverlay() {
    // if (this.connectionState.getValue() === ConnectionState.None || await requestDialog('Syncronize with another device')) {
      const componentRef = this.navigationService.pushOverlay(WaitingComponent);
      componentRef.instance.connectedEvent.subscribe(ignored => {
        this.navigationService.acceptOverlay();
      });
    // }
  }

  public async sync() {
    this.navigationService.pushOverlay(DeviceDiscoveryComponent);
  }
}
