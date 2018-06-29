import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  selector: 'app-new-ico',
  templateUrl: './new-ico.component.html',
  styleUrls: ['./new-ico.component.css']
})

export class NewIcoComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';
  
  public comp_name = new FormControl();
  public ticker = new FormControl();
  public amount_emitted = new FormControl(0);
  public amount_offered = new FormControl(0);
  public amount_fees = new FormControl(1);
  public address = new FormControl();
  public start_date = new FormControl();
  public end_date = new FormControl();
  public start_registration = new FormControl();
  public end_registration = new FormControl();
  public max_amount = new FormControl();
  public min_amount = new FormControl();
  public starting_price = new FormControl(1);
  public available_coins = new FormControl(['SPT']);
  public interval_time_auction = new FormControl(1);
  public interval_time_invite = new FormControl(1);
  public factor = new FormControl(1);
  public periodicity = new FormControl();
  public coins: any = ['SPT','BTC','BCH','ETH','LTC','ADA','NEO','XRP','XLM','XEM'];
  public companyTypes: any = [{name:'Classic', num: 1}, {name:'Auction', num: 2}];
  public cashbackTypes: any = ['Full refund', 'Partial refund', 'Non-refund'];
  public slotsTypes: any = ['Limited', 'Cyclical'];

  title: string = "New ICO";
  coinSym: string = this.coins[0];
  coinOfStartPrice: string = this.coinSym;
  coinOfFeesAmount: string = this.coinSym;
  coinOfInvestmentAmount = this.coinSym;
  feeTitle: string = "Fee";
  feePrice: number = 0;
  companyType: string;
  cashbackType: string;
  slotsType: string;
  balanceCurrency: number = 0;
  white_list: boolean = false;

  constructor(private readonly navigationService: NavigationService) { }

  ngOnInit() {
  }

  async onBack() {
    this.navigationService.cancelOverlay()
  }

  changeStartPrice(e) {
    console.log('CHANGE START PRICE', e);
    this.coinOfStartPrice = e.value;
  }

  changeFeesAmount(e) {
    console.log('CHANGE FEES AMOUNT', e);
    this.coinOfFeesAmount = e.value;
  }

  changeInvestmentAmount(e) {
    console.log('CHANGE INVESTMENT AMOUNT', e);
    this.coinOfInvestmentAmount = e.value;
  }

  async convertToSPT() {
    console.log('CONVERTING TO SPT');
  }

  async saveNewICO() {
    console.log('SAVE NEW ICO', this);
  }
}
