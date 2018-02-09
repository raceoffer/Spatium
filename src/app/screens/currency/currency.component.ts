import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit {
  
  currencyTitle: string;
  selectedAddress: string;

  cryptoCurrency = 1.001;
  usd = '2.002$';


  sendLabel: string = "Send";

  constructor(
	private route: ActivatedRoute,
	private router: Router
  ) { }

  ngOnInit() {
  	this.currencyTitle = this.route.paramMap.source.value.currency;
  }

}
