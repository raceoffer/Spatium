import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit {
  currencyTitle = this.route.paramMap.map(params => params.get('currency'));
  selectedAddress: string;

  cryptoCurrency = 1.001;
  usd = '2.002$';

  sendLabel = 'Send';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService
  ) {
    this.wallet.history.subscribe(history => {
      console.log(JSON.stringify(history));
    });
  }

  async ngOnInit() {}

  async send() {}
}
