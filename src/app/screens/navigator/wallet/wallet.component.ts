import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Coin, Token } from '../../../services/keychain.service';
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
    {title: 'NEM', symbols: 'XEM', cols: 1, rows: 1, logo: 'nem'},
    this.tokenEntry(Token.EOS),
    this.tokenEntry(Token.TRON),
    this.tokenEntry(Token.VECHAIN),
    this.tokenEntry(Token.ICON),
    this.tokenEntry(Token.OMNISEGO),
    this.tokenEntry(Token.BINANCECOIN),
    this.tokenEntry(Token.DIGIXDAO),
    this.tokenEntry(Token.POPULOUS),
    this.tokenEntry(Token.RCHAIN),
    this.tokenEntry(Token.MAKER),
    this.tokenEntry(Token.AETHERNITY),
    this.tokenEntry(Token.AUGUR),
    this.tokenEntry(Token.STATUS),
    this.tokenEntry(Token.BYTOM),
    this.tokenEntry(Token.AION),
    this.tokenEntry(Token.WALTONCHAIN),
    this.tokenEntry(Token.OX),
    this.tokenEntry(Token.ZILLIQA),
    this.tokenEntry(Token.KUCOIN_SHARES),
    this.tokenEntry(Token.VERITASEUM),
    this.tokenEntry(Token.QASH),
    this.tokenEntry(Token.LOOPRING),
    this.tokenEntry(Token.ETHOS),
    this.tokenEntry(Token.GOLEM),
    this.tokenEntry(Token.NEBULAS),
    this.tokenEntry(Token.DRAGONCHAIN),
    this.tokenEntry(Token.BASIC_ATTENTION_TOKEN),
    this.tokenEntry(Token.REVAIN),
    this.tokenEntry(Token.FUNFAIR),
    this.tokenEntry(Token.KYBER_NETWORK),
    this.tokenEntry(Token.IOSTOKEN),
    this.tokenEntry(Token.AELF),
    this.tokenEntry(Token.REQUEST_NETWORK),
    this.tokenEntry(Token.SALT),
    this.tokenEntry(Token.CHAINLINK),
    this.tokenEntry(Token.POLYMATH),
    this.tokenEntry(Token.POWER_LEDGER),
    this.tokenEntry(Token.KIN),
    this.tokenEntry(Token.DENTACOIN),
    this.tokenEntry(Token.NUCLEUS_VISION),
    this.tokenEntry(Token.BANCOR),
    this.tokenEntry(Token.TENX),
    this.tokenEntry(Token.ENIGMA),
    this.tokenEntry(Token.CINDICATOR),
    this.tokenEntry(Token.ARAGON),
    this.tokenEntry(Token.STORJ),
    this.tokenEntry(Token.NULS),
    this.tokenEntry(Token.ICONOMI),
    this.tokenEntry(Token.DENT),
    this.tokenEntry(Token.STORM),
    this.tokenEntry(Token.PILLAR),
    this.tokenEntry(Token.METAL),
    this.tokenEntry(Token.QUANTSTAMP),
    this.tokenEntry(Token.SUBSTRATUM),
    this.tokenEntry(Token.GNOSIS),
    this.tokenEntry(Token.SIRIN_LABS_TOKEN),
    this.tokenEntry(Token.DECENTRALAND),
    this.tokenEntry(Token.GENESIS_VISION),
    this.tokenEntry(Token.CIVIC),
    this.tokenEntry(Token.DYNAMIC_TRADING_RIGHTS),
    this.tokenEntry(Token.ENJIN_COIN),
    this.tokenEntry(Token.SINGULARITYNET),
    this.tokenEntry(Token.THETA_TOKEN),
    this.tokenEntry(Token.MONACO),
    this.tokenEntry(Token.SANTIMENT_NETWORK_TOKEN),
    this.tokenEntry(Token.IEXEC_RLC),
    this.tokenEntry(Token.RAIDEN_NETWORK_TOKEN),
    this.tokenEntry(Token.TIME_NEW_BANK),
    this.tokenEntry(Token.GENARO_NETWORK),
    this.tokenEntry(Token.CREDITS),
    this.tokenEntry(Token.WAX),
    this.tokenEntry(Token.POET),
    this.tokenEntry(Token.BIBOX_TOKEN),
    this.tokenEntry(Token.ARCBLOCK),
    this.tokenEntry(Token.XPA),
    this.tokenEntry(Token.HIGH_PERFOMANCE_BLOCKCHAIN),
    this.tokenEntry(Token.DEW),
    this.tokenEntry(Token.PAYPIE),
    this.tokenEntry(Token.OYSTER),
    this.tokenEntry(Token.EDGELESS),
    this.tokenEntry(Token.ENVION),
    this.tokenEntry(Token.FUSION),
    this.tokenEntry(Token.CUBE),
    this.tokenEntry(Token.SOPHIATX),
    this.tokenEntry(Token.ADEX),
    this.tokenEntry(Token.MEDISHARES),
    this.tokenEntry(Token.ETHLEND),
    this.tokenEntry(Token.OST),
    this.tokenEntry(Token.BLUZELLE),
    this.tokenEntry(Token.CRYPTO20),
    this.tokenEntry(Token.IOT_CHAIN),
    this.tokenEntry(Token.LEADCOIN),
    this.tokenEntry(Token.EIDOO),
    this.tokenEntry(Token.BLOCKV),
    this.tokenEntry(Token.CYBERMILES),
    this.tokenEntry(Token.RIPIO_CREDIT_NETWORK),
    this.tokenEntry(Token.PUNDI_X),
    this.tokenEntry(Token.VIBE),
    this.tokenEntry(Token.SONM),
    this.tokenEntry(Token.LOOM_NETWORK)
  ];

  @ViewChild('sidenav') sidenav;

  constructor(
    private readonly ngZone: NgZone,
    private readonly router: Router,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly currency: CurrencyService
  ) { }

  public tokenEntry(coin: Token) {
    const currencyInfo = this.currency.getInfo(coin);
    return {
      title: currencyInfo.name,
      symbols: currencyInfo.symbol,
      logo: currencyInfo.icon,
      cols: 1,
      rows: 1,
      coin: coin
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
