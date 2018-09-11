import { ChangeDetectionStrategy, Component, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map } from 'rxjs/operators';
import { NavbarComponent } from '../../../modals/navbar/navbar.component';
import { DeviceService, Platform } from '../../../services/device.service';
import { NavigationService, Position } from '../../../services/navigation.service';
import { toBehaviourSubject } from '../../../utils/transformers';
import { FeedbackComponent } from '../../feedback/feedback.component';
import { CurrencyComponent } from '../currency/currency.component';
import { SettingsComponent } from '../settings/settings.component';
import { WaitingComponent } from '../waiting/waiting.component';
import { Router } from '@angular/router';
import { CurrencyId, CurrencyInfoService } from '../../../services/currencyinfo.service';
import { SyncService } from '../../../services/sync.service';
import { Tile } from '../../../elements/tile-coin/tile-coin.component';
import { KeyChainService } from '../../../services/keychain.service';

import uuid from 'uuid/v5';

import {
  Utils,
  DistributedEcdsaKey
} from 'crypto-core-async';

import { PlainSocket } from '../../../utils/sockets/plainsocket';
import { RPCClient } from '../../../services/rpc/rpc-client';
import { Client } from '../../../utils/client-server/client-server';

const serviceId = '57b23ea7-26b9-47c4-bd90-eb0664df26a0';

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

  public tiles = new Array<Tile>();

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

  private socket: PlainSocket;
  private rpcClient: RPCClient;
  private sessionId: string;
  private paillierPublicKey: any;
  private paillierSecretKey: any;

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly deviceService: DeviceService,
    private readonly navigationService: NavigationService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService,
    private readonly keyChainService: KeyChainService
  ) {
    this.tiles.push(
      ... [
        CurrencyId.Bitcoin,
        CurrencyId.Litecoin,
        CurrencyId.BitcoinCash,
        CurrencyId.Ethereum,
        CurrencyId.Neo
      ].map((currencyId) => {
        return Tile.fromCurrency(this.currencyInfoService.currencyInfo(currencyId));
      })
    );

    for (const tile of this.tiles.slice(0)) {
      this.tiles.push(
        ... tile.currencyInfo.tokens.map((tokenInfo) => {
          return Tile.fromToken(tile.currencyInfo, tokenInfo);
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
        return Tile.fromCurrency(this.currencyInfoService.currencyInfo(currencyId));
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

    const seedHash = await Utils.sha256(this.keyChainService.seed);

    this.sessionId = uuid(seedHash.toJSON().data, serviceId);

    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    this.paillierPublicKey = publicKey;
    this.paillierSecretKey = secretKey;

    console.log(this.sessionId);
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
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

  public openCurrencyOverlay(tile) {
    const componentRef = this.navigationService.pushOverlay(CurrencyComponent);
    componentRef.instance.tile = tile;
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
    console.log('sync()');

    this.socket = new PlainSocket();
    this.rpcClient = new RPCClient(new Client(this.socket));

    await this.socket.open('127.0.0.1', 5666);

    const capabilities = await this.rpcClient.api.capabilities({});
    console.log(capabilities);

    await this.syncService.sync(
      this.sessionId,
      this.paillierPublicKey,
      this.paillierSecretKey,
      this.rpcClient
    );

    console.log('Synchronized');
  }
}
