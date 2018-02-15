import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionType, WalletService } from '../../services/wallet.service';
import { Observable } from 'rxjs/Observable';

declare const bcoin: any;

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit {

  transactions: any = [];
  
  currencyTitle = this.route.paramMap.map(params => params.get('currency'));
  currencySymbol: string = 'BTC';
  usdTitle: string = 'USD';

  addresses = [];
  selectedAddress;

  currencyValueConfirmed;
  currencyValueUnconfirmed;
  usdValueConfirmed;
  usdValueUnconfirmed;

  addressLabel: string = "Address";
  sendLabel: string = "Send";

  constructor(
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService
  ) {
    this.wallet.listTransactionHistory().then(txs => { 
      this.transactions = (txs || [])
        .map(function(tx){
          tx.formattedAmount = bcoin.amount.btc(tx.amount);
          return tx;
        })
        .sort(this.compareTransactions)
        ;

      console.log("txs");
      console.log(txs);
    });

    this.wallet.address.subscribe(address => {
      this.addresses = [address];
      this.selectedAddress = this.addresses[0];
    });

    this.wallet.balance.subscribe(balance => {
      this.currencyValueConfirmed = bcoin.amount.btc(balance.confirmed);
      this.usdValueConfirmed = this.currencyValueConfirmed;

      this.currencyValueUnconfirmed = bcoin.amount.btc(balance.unconfirmed);
      this.usdValueUnconfirmed = this.currencyValueUnconfirmed;
    });
  }

  ngOnInit() {}

  send() {}

  compareTransactions(a, b) {
    // First unconfirmed transactions
    if (!a.confirmed && !b.confirmed)
      return 0;

    if (!a.confirmed && b.confirmed)
      return 1;

    if (a.confirmed && !b.confirmed)
      return -1;

    // then confirmed transactions sorted by time
    if (a.time > b.time)
      return 1;

    if (a.time < b.time)
      return -1;

    return 0;
  }

}
/*
[{"type":0,"from":null,"to":"myYjGjcC3S3RQ1zWDHkZz1Kh73t4FAp94n","amount":75639038,"confirmed":false},
{"type":0,"from":null,"to":"myYjGjcC3S3RQ1zWDHkZz1Kh73t4FAp94n","amount":104472709,"confirmed":false}]
*/