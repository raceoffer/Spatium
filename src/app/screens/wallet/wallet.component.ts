import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Coin } from '../../services/keychain.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent {
  public title = 'Wallet';
  public navLinks = [{
      name: 'Wallet',
      link: ['/navigator', '/waiting', { outlets: { navigator: ['wallet'] } }],
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
      link: '',
      isSelected: false,
      isActive: false
    }, {
      name: 'Exit',
      link: '/start',
      isSelected: false,
      isActive: true
    }];

  public tiles = [
    {title: 'Ethereum', cols: 2, rows: 2, logo: 'ethereum'},
    {title: 'Bitcoin', cols: 1, rows: 1, logo: 'btc', coin: Coin.BTC},
    {title: 'Litecoin', cols: 1, rows: 1, logo: 'litecoin', coin: Coin.BCH},
    {title: 'Bitcoin Cash', cols: 1, rows: 1},
    {title: 'Cardano', cols: 1, rows: 1},
    {title: 'NEO', cols: 1, rows: 1},
    {title: 'Ripple', cols: 1, rows: 1},
    {title: 'Stellar', cols: 2, rows: 2},
    {title: 'EOS', cols: 1, rows: 1},
    {title: 'NEM', cols: 1, rows: 1}
  ];

  constructor(private readonly router: Router) { }

  public async onNav(navLink) {
    await this.router.navigate(navLink.link);
  }

  async onTileClicked(coin: Coin) {
    await this.router.navigate(['/navigator', '/waiting', { outlets: { 'navigator': ['currency', coin] } }]);
  }
}
