import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionType, WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit {

  transactions: any = [
    {
      type: 'Input',
      amount: 0.00340815,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      confirmed: false
    }, {
      type: 'Output',
      amount: 0.22571509,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      confirmed: false
    }, {
      type: 'Input',
      amount: 0.00340815,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      time: '15.01.18 19:43',
      confirmed: true
    }, {
      type: 'Output',
      amount: 0.22571509,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      time: '14.01.18 19:43',
      confirmed: true
    }, {
      type: 'Input',
      amount: 0.00340815,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      time: '13.01.18 19:43',
      confirmed: true
    }, 
  ];
  
  currencyTitle = this.route.paramMap.map(params => params.get('currency'));
  currencySymbol: string = 'BTC';
  usdTitle: string = 'USD';

  currencyValue = 1.001;
  usdValue = 2.002;

  selectedAddress: string;

  addressLabel: string = "Address";
  sendLabel: string = "Send";

  constructor(
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService
  ) {
    this.wallet.history.subscribe(history => {
      console.log(JSON.stringify(history));
    });
  }

  ngOnInit() {}

}
