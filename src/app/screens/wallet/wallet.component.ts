import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Coin } from '../../services/keychain.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent {
  tiles = [
    {title: 'Ethereum', cols: 2, rows: 2, logo: 'ethereum', coin: Coin.ETH},
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

  constructor(
    private readonly router: Router
  ) { }

  async onTileClicked(coin: Coin) {
    await this.router.navigate(['/navigator', { outlets: { 'navigator': ['send-transaction', coin] } }]);
  }
}
