import { Component, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent{

  tiles = [
    {title: 'Ethereum', cols: 2, rows: 2, logo: 'ethereum'},
    {title: 'Bitcoin', cols: 1, rows: 1, logo: 'btc'},
    {title: 'Litecoin', cols: 1, rows: 1, logo: 'litecoin'},
    {title: 'Bitcoin Cash', cols: 1, rows: 1},
    {title: 'Cardano', cols: 1, rows: 1},
    {title: 'NEO', cols: 1, rows: 1},
    {title: 'Ripple', cols: 1, rows: 1},
    {title: 'Stellar', cols: 2, rows: 2},
    {title: 'EOS', cols: 1, rows: 1},
    {title: 'NEM', cols: 1, rows: 1}
  ];

  constructor(private readonly router: Router,
              private readonly route:  ActivatedRoute) { }

  async onTileClicked() {
    console.log('tile clicked');
    await this.router.navigate(['./send-transaction'], { relativeTo: this.route });
  }

}
