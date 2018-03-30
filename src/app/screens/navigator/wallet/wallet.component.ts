import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Coin, KeyChainService, Token, TokenEntry } from '../../../services/keychain.service';
import { NotificationService } from '../../../services/notification.service';
import { NavigationService } from '../../../services/navigation.service';
import { CurrencyService } from '../../../services/currency.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  public isOpened = false;
  public title = 'Wallet';
  public isExitTap = false;
  public navLinks = [{
      name: 'Wallet',
      link: ['/navigator', { outlets: { navigator: ['wallet'] } }],
      isSelected: true,
      isActive: true
    }, {
      name: 'Exchange',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'ICO',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Portfolio Investment',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Verification',
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Settings',
      link: ['/navigator', { outlets: { navigator: ['settings'] } }],
      isSelected: false,
      isActive: true
    }, {
      name: 'Exit',
      link: ['/start'],
      isSelected: false,
      isActive: true
    }];

  public tiles = [
    {title: 'Bitcoin', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC},
    {title: 'Bitcoin Test', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC_test},
    {title: 'Bitcoin Cash', symbols: 'BCH', cols: 1, rows: 1, logo: 'bitcoin-cash', coin: Coin.BCH},
    {title: 'Ethereum', symbols: 'ETH', cols: 1, rows: 1, logo: 'ethereum', coin: Coin.ETH},
    {title: 'Litecoin', symbols: 'LTC', cols: 1, rows: 1, logo: 'litecoin'},
    {title: 'Cardano', symbols: 'ADA', cols: 1, rows: 1, logo: 'cardano'},
    {title: 'NEO', symbols: 'NEO', cols: 1, rows: 1, logo: 'neo'},
    {title: 'Ripple', symbols: 'XRP', cols: 1, rows: 1, logo: 'ripple'},
    {title: 'Stellar', symbols: 'XLM', cols: 1, rows: 1, logo: 'stellar'},
    {title: 'NEM', symbols: 'XEM', cols: 1, rows: 1, logo: 'nem'}
  ];

  @ViewChild('sidenav') sidenav;

  constructor(
    private readonly ngZone: NgZone,
    private readonly router: Router,
    private readonly keychain: KeyChainService,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly currency: CurrencyService
  ) {
    keychain.topTokens.forEach((tokenInfo) => {
      this.tiles.push(this.tokenEntry(tokenInfo));
    });

  }

  public tokenEntry(tokenInfo: TokenEntry) {
    return {
      title: tokenInfo.name,
      symbols: tokenInfo.ico,
      logo: tokenInfo.className,
      cols: 1,
      rows: 1,
      coin: tokenInfo.token
    };
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async onNav(navLink) {
    await this.router.navigate(navLink.link);
  }

  public toggle() {
    this.isOpened = !this.isOpened;
  }

  async onTileClicked(coin: Coin) {
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['currency', coin] } }]);
  }

  async onBackClicked() {
    if (this.isOpened) {
      console.log('isOpened');
      this.sidenav.toggle();
    } else if (this.isExitTap) {
      console.log('isExitTap');
      this.notification.hide();
      await this.router.navigate(['/start']);
    } else {
      console.log('await');
      this.notification.show('Tap again to exit');
      this.isExitTap = true;
      setTimeout(() => this.ngZone.run(() => {
        this.isExitTap = false;
      }), 3000);
    }
  }
}
