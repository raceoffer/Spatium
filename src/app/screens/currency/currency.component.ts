import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit {

  transactions: any = [
    {
      type: 'Input',
      value: 0.00340815,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      status: 'Confirmed'
    }, {
      type: 'Output',
      value: 0.22571509,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      status: 'Confirmed'
    }, {
      type: 'Input',
      value: 0.00340815,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      status: 'Confirmed'
    }, {
      type: 'Output',
      value: 0.22571509,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      status: 'Unconfirmed'
    }, {
      type: 'Input',
      value: 0.00340815,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      status: 'Unconfirmed'
    }, {
      type: 'Output',
      value: 0.22571509,
      address: '12KGmVfy1pRGGhWGWZoq19LaZxEyGd9fZ9',
      status: 'Unconfirmed'
    }
  ];
  
  currencyTitle: string = '';
  currencySymbol: string = 'BTC';
  usdTitle: string = 'USD';

  currencyValue = 1.001;
  usdValue = '2.002';

  selectedAddress: string;

  addressLabel: string = "Address";
  sendLabel: string = "Send";

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.currencyTitle = this.route.paramMap.source.value.currency;
  }

}
