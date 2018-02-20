import {Component, Output} from '@angular/core';
import { Router } from '@angular/router';
import { Coin } from '../../../services/keychain.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent {
  public isOpened = false;
  public title = 'Wallet';
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
    {title: 'Ethereum', cols: 2, rows: 2, logo: 'ethereum'},
    {title: 'Bitcoin', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC},
    {title: 'Bitcoin Cash', cols: 1, rows: 1, logo: 'bitcoin-cash', coin: Coin.BCH},
    {title: 'Litecoin', cols: 1, rows: 1, logo: 'litecoin'},
    {title: 'Cardano', cols: 1, rows: 1, logo: 'cardano'},
    {title: 'NEO', cols: 1, rows: 1, logo: 'neo'},
    {title: 'Ripple', cols: 1, rows: 1, logo: 'ripple'},
    {title: 'Stellar', cols: 2, rows: 2, logo: 'stellar'},
    {title: 'EOS', cols: 1, rows: 1, logo: 'eos'},
    {title: 'NEM', cols: 1, rows: 1, logo: 'nem'}
  ];

  constructor(private readonly router: Router) { }

  public async onNav(navLink) {
    await this.router.navigate(navLink.link);
  }

  public toggle() {
    this.isOpened = !this.isOpened;
  }

  async onTileClicked(coin: Coin) {
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['currency', coin] } }]);
  }
}
