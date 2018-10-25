import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { sha256 } from 'crypto-core-async/lib/utils';
import { IcoCampaign, ICOService } from '../../../../services/ico.service';
import { File, IpfsService } from '../../../../services/ipfs.service';
import { NavigationService } from '../../../../services/navigation.service';
import { NotificationService } from '../../../../services/notification.service';

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
  public max_investment = new FormControl(0);
  public starting_price = new FormControl(1);
  public available_coins = new FormControl(['SPT']);
  public interval_time_auction = new FormControl(1);
  public interval_time_invite = new FormControl(1);
  public factor = new FormControl(1);
  public periodicity = new FormControl();
  public logo = new FormControl();
  public description = new FormControl();
  public coins: any = ['SPT', 'BTC', 'BCH', 'ETH', 'LTC', 'ADA', 'NEO', 'XRP', 'XLM', 'XEM'];
  public companyTypes: any = [{name: 'Classic', id: 1}, {name: 'Auction', id: 2}];
  public cashbackTypes: any = [{name: 'Full refund', id: 1}, {name: 'Partial refund', id: 2}, {name: 'Non-refund', id: 3}];
  public whitelistTypes: any = [{name: 'None', id: 0}, {name: 'Limited', id: 1}, {name: 'Cyclical', id: 2}];
  public fundraisingTypes: any = [{name: 'Crowd', id: 1}, {name: 'Queue', id: 2}];

  public password = new FormControl();

  public errors: string[] = [];
  campaign: IcoCampaign = new IcoCampaign('', 'New ICO', '');
  coinSym: string = this.coins[0];
  coinOfStartPrice: string = this.coinSym;
  coinOfFeesAmount: string = this.coinSym;
  feeTitle = 'Fee';
  feePrice = 0;
  companyType = 1;
  cashbackType = 1;
  whitelistType = 0;
  fundraisingType = 1;
  balanceCurrency = 0;
  descriptionFile: any;
  descriptionFileName: string;
  logoFile: any;
  logoFileName: string;

  isSaving = false;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly icoService: ICOService,
    private readonly ipfsService: IpfsService
  ) { }

  ngOnInit() {
  }

  async onBack() {
    this.navigationService.cancelOverlay();
  }

  changeStartPrice(e) {
    console.log('CHANGE START PRICE', e);
    this.coinOfStartPrice = e.value;
  }

  changeFeesAmount(e) {
    console.log('CHANGE FEES AMOUNT', e);
    this.coinOfFeesAmount = e.value;
  }

  changeFundraising(fundraisingType) {
    if (fundraisingType === 2 && this.whitelistType === 0) {
      this.whitelistType = 1;
    }
  }

  changeWhitelist(whitelistType) {
    if (whitelistType === 0 && this.fundraisingType === 2) {
      this.fundraisingType = 1;
    }
  }

  changeLogo(e) {
    const file = e.target.files[0];
    this.logoFile = file;
    this.logoFileName = (file !== null) ? file.name : '';
  }

  changeDescription(e) {
    const file = e.target.files[0];
    this.descriptionFile = file;
    this.descriptionFileName = (file !== null) ? file.name : '';
  }

  async convertToSPT() {
    console.log('CONVERTING TO SPT');
  }

  public async checkErrors() {
    this.errors = [];

    if (!this.password.valid ||
      (await sha256(Buffer.from(this.password.value))).toString('hex').toLowerCase() !==
        '8dbeac44e0c26cec8af751817eef6be75b5fb179dc113a469c90858eb23358c6') {
      this.errors.push('Wrong password');
    }
    if (!this.start_date.valid) {
      this.errors.push('Start date is required');
    }
    if (!this.end_date.valid) {
    this.errors.push('End date is required');
    }
    if (!this.ticker.valid) {
    this.errors.push('Ticker is invalid');
    }
    if (!this.address.valid) {
    this.errors.push('Address is invalid');
    }
    if (!this.comp_name.valid) {
    this.errors.push('Company name is invalid');
    }
    return this.errors.length > 0;
  }

  async saveNewICO() {
    if (await this.checkErrors()) {
      return;
    }

    this.isSaving = true;
    const campaign = new IcoCampaign('', '', '');
    campaign.startDate = this.start_date.value;
    campaign.endDate = this.end_date.value;
    campaign.ticker = this.ticker.value;
    campaign.address = this.address.value;
    campaign.title = this.comp_name.value;
    campaign.type = this.companyType;
    campaign.cashbackType = this.cashbackType;
    campaign.amountEmitted = this.amount_emitted.value;
    campaign.amountOffered = this.amount_offered.value;

    const hash = await this.uploadFiles(campaign);

    campaign.ipfsFolder = hash;
    try {
      const result = await this.icoService.addCampaign(campaign);
    } catch (e) {
      console.error(e);
      this.errors.push(e);
      this.isSaving = false;
      return;
    }

    this.created.emit(campaign);
    this.isSaving = false;
    this.notification.show('ICO campaign created');
  }

  async uploadFiles(campaign: IcoCampaign) {
    let localFiles, uploadedFiles = [];
    localFiles = await this.getFiles(campaign);
    try {
      uploadedFiles = await this.ipfsService.add(localFiles);
      console.log(uploadedFiles);

      let folder;
      uploadedFiles.forEach(file => {
        if (file.path === campaign.title) {
          folder = file.hash;
        }
      });
      return folder;
    } catch (e) {
      // TODO show message to the user
      console.log(e);
      return '';
    }
  }

  async getFiles(campaign: IcoCampaign) {
    const dir = '/' + campaign.title + '/';
    const files = [];

    if (this.logoFile) {
      files.push({ name: dir + 'logo', path: this.logoFile });
    }

    if (this.descriptionFile) {
      files.push({ name: dir + 'description', path: this.descriptionFile });
    }

    return Promise.all([].map.call(files, function (file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve(new File(file.name, Buffer.from(reader.result)));
        };
        reader.readAsArrayBuffer(file.path);
      });
    })).then(function (results) {
      return results;
    });
  }
}
