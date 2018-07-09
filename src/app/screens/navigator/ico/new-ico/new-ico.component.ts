import { Component, HostBinding, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { NavigationService } from '../../../../services/navigation.service';
import { NotificationService } from '../../../../services/notification.service';
import { ICOService, IcoCampaign } from '../../../../services/ico.service';

@Component({
  selector: 'app-new-ico',
  templateUrl: './new-ico.component.html',
  styleUrls: ['./new-ico.component.css']
})

export class NewIcoComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() public created = new EventEmitter<IcoCampaign>();
  
  public comp_name = new FormControl('', [Validators.required]);
  public ticker = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]);
  public amount_emitted = new FormControl(0);
  public amount_offered = new FormControl(0);
  public amount_fees = new FormControl(1);
  public address = new FormControl('', [Validators.required, Validators.pattern('^(0x){1}[0-9a-fA-F]{40}$')]);
  public start_date = new FormControl('', [Validators.required]);
  public end_date = new FormControl('', [Validators.required]);
  public start_registration = new FormControl('', [Validators.required]);
  public end_registration = new FormControl('', [Validators.required]);
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

  public errors: string[] = [];

  campaign: IcoCampaign = new IcoCampaign('', 'New ICO', '');

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

  isSaving: boolean = false;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly icoService: ICOService
  ) { }

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

  public checkErrors() {
    this.errors = [];
    if(!this.start_date.valid)
      this.errors.push("Start date is required");
    if(!this.end_date.valid)
      this.errors.push("End date is required");
    if(!this.ticker.valid)
      this.errors.push("Ticker is invalid");
    if(!this.address.valid)
      this.errors.push("Address is invalid");
    if(!this.comp_name.valid)
      this.errors.push("Company name is invalid");
      return this.errors.length > 0;
  }

  async saveNewICO() {
    if(this.checkErrors())
      return;

    this.isSaving = true;
    let campaign = new IcoCampaign('', '', '');
    campaign.startDate = this.start_date.value;
    campaign.endDate = this.end_date.value;
    campaign.ticker = this.ticker.value;
    campaign.address = this.address.value;
    campaign.title = this.comp_name.value;
    campaign.type = this.companyType;
    campaign.cashbackType = this.cashbackType;
    campaign.amountEmitted = this.amount_emitted.value;
    campaign.amountOffered = this.amount_offered.value;
    campaign.ipfsFolder = 'ipfsFolder';
    try {
      let result = await this.icoService.addCampaign(campaign);
      console.log(result);
    }
    catch(e) {
      console.error(e);
      this.errors.push(e);
      this.isSaving = false;
      return;
    }

    this.created.emit(campaign);
    this.isSaving = false;
    this.notification.show('ICO campaign created');
  }
}
