import { Component, HostBinding, OnDestroy, Input, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { FormControl } from '@angular/forms';
import { NotificationService } from '../../../../services/notification.service';
import { Coin } from '../../../../services/keychain.service';
import { WalletService } from '../../../../services/wallet.service';
import { CurrencyService } from '../../../../services/currency.service';
import { NavigationService } from '../../../../services/navigation.service';
import { InvestmentComponent } from '../investment/investment.component';

declare const cordova;

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;

  public investor_transactions: boolean = false;

  transaction: object;
  title: string = 'Transactions';
  counter: number = 0;
  selector: boolean = false;
  selected: any = [];
  transactions: any;

  constructor(private readonly currency: CurrencyService,
              private readonly notification: NotificationService,
              private readonly navigationService: NavigationService) {
   this.transactions = [
      {coin: this.currency.getInfo(Coin.BTC).icon, symbol: this.currency.getInfo(Coin.BTC).symbol, 
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 
        to_address: '1LL87k1vMqAaMJBCR4wfy7nGivgt3hmBKG', valid_to_address: '1LL87k1vMqAaMJBCR2wfy7nGivgt3hmBKG',
        id:'0794d9c0fb0b5bc430cbaeea2b6e76fef551855c69ef0093c176a74c4459505e',
        amount: '120', raw_date: 1429492572, confirmations: 3},
      {coin: this.currency.getInfo(Coin.ETH).icon, symbol: this.currency.getInfo(Coin.ETH).symbol, 
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        to_address: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH', valid_to_address: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH',
        id:'651aff924e44eeef11b4bc24bfca7242f4bb87f0f8bd8dc89106c8bdcc7fb8bc',
        amount: '100', raw_date: 1529492572, confirmations: 5},
    ];
  }

  ngOnInit() {
    const now = new Date();

    function getDate(time) {
      return (time < 10)?"0"+time:time;
    }

    this.transactions.forEach((item, i) => {
      const receiving = new Date(item.raw_date*1000);
      item.date = (receiving.getFullYear() !== now.getFullYear())?
        receiving.getMonth() + "." + receiving.getDate() + "." + receiving.getFullYear() + " " + getDate(receiving.getHours()) + ":" + getDate(receiving.getMinutes()) + ":" + getDate(receiving.getSeconds()):
        receiving.getMonth() + "." + receiving.getDate() + " " + getDate(receiving.getHours()) + ":" + getDate(receiving.getMinutes()) + ":" + getDate(receiving.getSeconds());
    });
  }

  ngOnDestroy() {

  }

  async onBack() {
    if (this.transaction) {
      this.transaction = null;
      this.title = 'Transactions'
    } else {
      this.navigationService.back();
    }
  }

  popUpDetails(transaction) {
    this.transaction = transaction;
    this.title = 'Investment details';
  }

  eachTransaction(set, name, value) {
    this.transactions.forEach((item, i) => {
      if (set)
        item[name] = value;
      else
        delete item[name];
      if (name === 'chosen')
        this.counter = (value)?this.transactions.length:0;
    });
  }

  selectTransaction(e) {
    this.selector = !this.selector;
    if (this.selector)
      this.eachTransaction(true, 'chosen', false);
    else {
      this.eachTransaction(false, 'chosen', false);
      this.selected = [];
    }
  }

  check(e, transaction) {
    e.preventDefault();
    transaction.chosen = !transaction.chosen;
    this.counter = (transaction.chosen)? this.counter+1: this.counter-1;
  }

  selectAll() {
    console.log("Select all", this);
  }

  structured(address) {
    let structured_address = '';
    for (let x = 0; x < address.length; x += 4) {
      structured_address += ((x + 4) < address.length)?address.substring(x, x+4) + " ":address.substring(x, address.length);
    }
    return structured_address;
  }

  copy(address) {
    cordova.plugins.clipboard.copy(address);
    this.notification.show("Copied to clipboard");
  }
}
