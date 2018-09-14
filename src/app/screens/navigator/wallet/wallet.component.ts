import { ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, map } from 'rxjs/operators';
import { NavbarComponent } from '../../../modals/navbar/navbar.component';
import { CurrencyId, CurrencyInfoService } from '../../../services/currencyinfo.service';
import { DeviceService, Platform } from '../../../services/device.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NavigationService, Position } from '../../../services/navigation.service';
import { Device } from '../../../services/primitives/device';
import { RPCConnectionService } from '../../../services/rpc/rpc-connection.service';
import { SyncService } from '../../../services/sync.service';
import { CurrencyModel, SyncState } from '../../../services/wallet/wallet';
import { toBehaviourSubject } from '../../../utils/transformers';
import { FeedbackComponent } from '../../feedback/feedback.component';
import { CurrencyComponent } from '../currency/currency.component';
import { DeviceDiscoveryComponent } from '../device-discovery/device-discovery.component';
import { SettingsComponent } from '../settings/settings.component';
import { requestDialog } from '../../../utils/dialog';
import { NotificationService } from '../../../services/notification.service';
import { BehaviorSubject } from 'rxjs';

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

  public synchronizing = new BehaviorSubject<boolean>(false);

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly deviceService: DeviceService,
    private readonly navigationService: NavigationService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService,
    private readonly keyChainService: KeyChainService,
    private readonly connectionService: RPCConnectionService,
    private readonly notificationService: NotificationService
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

    this.openDiscoveryOverlay();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.syncService.cancel();
    await this.connectionService.disconnect();
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

  public async openDiscoveryOverlay() {
    const componentRef = this.navigationService.pushOverlay(DeviceDiscoveryComponent);
    componentRef.instance.selected.subscribe(async (device) => {
      this.navigationService.acceptOverlay();

      await this.sync(device);
    });
  }

  public async sync(device: Device) {
    if (this.synchronizing.getValue()) {
      await this.syncService.cancel();
    }

    try {
      this.synchronizing.next(true);

      await this.connectionService.connectPlain(device.ip, device.port);

      const capabilities = await this.connectionService.rpcClient.api.capabilities({});
      console.log(capabilities);

      const appInfo: any = await this.deviceService.appInfo();
      const deviceInfo: any = await this.deviceService.deviceInfo();
      const version = appInfo.version.match(/^(\d+)\.(\d+)\.(\d+)(\.\d+)?$/);

      const handshakeResponse = await this.connectionService.rpcClient.api.handshake({
        sessionId: this.keyChainService.sessionId,
        deviceInfo: {
          deviceName: deviceInfo.model,
          appVersionMajor: version[1],
          appVersionMinor: version[2],
          appVersionPatch: version[3]
        },
      });

      const peerId = handshakeResponse.peerId;

      if (!!this.syncService.currentPeerId && this.syncService.currentPeerId !== peerId) {
        if (!await requestDialog(
          'The remote device\'s peer id does not match the last session. The wallet will be synced from scratch. Continue?'
        )) {
          return;
        }
      }

      const syncStatusResponse = await this.connectionService.rpcClient.api.syncStatus({
        sessionId: this.keyChainService.sessionId
      });

      const remoteSyncedCurrencies = syncStatusResponse.statuses
        .filter(status => status.state === SyncState.Finalized)
        .map(status => status.currencyId);

      console.log('Remote synched currencies:', remoteSyncedCurrencies);

      const localSynchedCurrencies = this.syncService.currencies
        .filter(c => c.state.getValue() === SyncState.Finalized)
        .map(c => c.id);

      console.log('Local synched currencies:', localSynchedCurrencies);

      const unsyncedCurrencies = localSynchedCurrencies.filter(x => !remoteSyncedCurrencies.includes(x));

      if (unsyncedCurrencies.length > 0) {
        this.notificationService.show(
          'The remote device doesn\'t prvide enough synchronized currencies. Some currencies will be re-synced'
        );
      }

      await this.syncService.sync(
        peerId,
        this.keyChainService.sessionId,
        this.keyChainService.paillierPublicKey,
        this.keyChainService.paillierSecretKey,
        this.connectionService.rpcClient
      );

      console.log('Synchronized');
    } catch (e) {
      console.error(e);
      this.notificationService.show('Synchronization error');
    } finally {
      this.synchronizing.next(false);
    }
  }
}
