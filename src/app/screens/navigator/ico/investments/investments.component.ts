import { Component, HostBinding, OnDestroy, Input, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/notification.service';
import { NavigationService } from '../../../../services/navigation.service';
import { CurrencyInfoService, CurrencyId } from '../../../../services/currencyinfo.service';
import { CurrencyModel } from '../../../../services/wallet/wallet';
import { TransactionType } from '../../currency/currency.component';

declare const cordova;

@Component({
  selector: 'app-investments',
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css']
})
export class InvestmentsComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;
  @Input() public investor = true;
  public txType = TransactionType;

  transaction: object;
  title = 'Investments';
  _counter = 0;
  blocks: any = [{
    visible: true,
    icon: 'error_outline'
  }, {
    visible: true,
    icon: 'check_circle_outline'
  }, {
    visible: true,
    icon: 'mail'
  }];
  monthNames: any = [
    'January', 'February', 'March',
    'April', 'May', 'June',
    'July', 'August', 'September',
    'October', 'November', 'December'
  ];
  validation_types: any = [
    {
      criterion: 'true',
      name: 'All'
    }, {
      criterion: '(transaction.from === transaction.valid_from && transaction.to === transaction.valid_to)',
      name: 'Valid'
    }, {
      criterion: '(transaction.from !== transaction.valid_from || transaction.to !== transaction.valid_to)',
      name: 'Invalid'
    }];

  resolution_types: any = [
    {
      criterion: 'true',
      name: 'All'
    }, {
      criterion: 'transaction.handled === undefined',
      name: 'New'
    }, {
      criterion: '!!transaction.handled',
      name: 'Resolved'
    }, {
      criterion: '(!!transaction.handled && transaction.handled.type === "approved")',
      name: 'Approved'
    }, {
      criterion: '(!!transaction.handled && transaction.handled.type === "refunded")',
      name: 'Refunded'
    }];
  filter_name: any = [];

  get counter() {
    return this._counter;
  }

  set counter(value) {
    if (value < 0) {
      this._counter = 0;
    } else {
      this._counter = value;
    }
  }

  selector = false;
  selected: any = [];
  input_tx: any = [];
  output_tx: any = [];
  filtered_input: any = [];
  transactions: any;

  constructor(
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService
  ) {
    const models = new Map<CurrencyId, CurrencyModel>([
      CurrencyId.Bitcoin,
      CurrencyId.Litecoin,
      CurrencyId.BitcoinCash,
      CurrencyId.Ethereum,
      CurrencyId.Neo
    ].map((currencyId) => {
      return [currencyId, CurrencyModel.fromCoin(this.currencyInfoService.currencyInfo(currencyId))] as [CurrencyId, CurrencyModel];
    }));

    this.transactions = [{
      coin: models.get(CurrencyId.Bitcoin).logo, symbol: models.get(CurrencyId.Bitcoin).ticker,
      from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_from: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      to: '1LL87k1vMqAaMJBCR4wfy7nGivgt3hmBKG', valid_to: '1LL87k1vMqAaMJBCR2wfy7nGivgt3hmBKG',
      id: '0794d9c0fb0b5bc430cbaeea2b6e76fef551855c69ef0093c176a74c4459505e',
      amount: '20,77', raw_date: 1429492572, confirmations: 3, type: this.txType.Out
    }, {
      coin: models.get(CurrencyId.Ethereum).logo, symbol: models.get(CurrencyId.Ethereum).ticker,
      from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      to: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH', valid_to: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH',
      id: '651aff924e44eeef11b4bc24bfca7242f4bb87f0f8bd8dc89106c8bdcc7fb8bc',
      amount: '3,22', raw_date: 1529492572, confirmations: 5, type: this.txType.Out
    }, {
      coin: models.get(CurrencyId.Litecoin).logo, symbol: models.get(CurrencyId.Litecoin).ticker,
      from: '3CDJNfdWX8m2NwuGUV3nhXHXEeLygMXoAj', valid_from: '3CDJNfdWX8m2NwuGUV3nhXHXEeLygMXoAj',
      to: 'LWSygPfS6FEiDqdj2xmVF8CSZJREo4LbKd', valid_to: 'LfPZJhLRpuELaKPmtbYNEEwCXVcxk1WUdp',
      id: '1bcaac25e1fec7449e5915d54726ef35bef2beb4905549a0d7a4450404104080',
      amount: '14,88', raw_date: 1329492572, confirmations: 19, type: this.txType.In
    }, {
      coin: models.get(CurrencyId.Ethereum).logo, symbol: models.get(CurrencyId.Ethereum).ticker,
      from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      to: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH', valid_to: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH',
      id: '651aff924e44eeef11b4bc24bfca7242f4bb87f0f8bd8dc89106c8bdcc7fb8bc',
      amount: '2,28', raw_date: 1529412572, confirmations: 48, type: this.txType.In
    }, {
      coin: models.get(CurrencyId.Bitcoin).logo, symbol: models.get(CurrencyId.Bitcoin).ticker,
      from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_from: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      to: '1LL87k1vMqAaMJBCR4wfy7nGivgt3hmBKG', valid_to: '1LL87k1vMqAaMJBCR4wfy7nGivgt3hmBKG',
      id: '0794d9c0fb0b5bc430cbaeea2b6e76fef551855c69ef0093c176a74c4459505e',
      amount: '13,37', raw_date: 1439482572, confirmations: 41, type: this.txType.In, handled: {
        type: 'approved', amount: 12, ticker: 'XYZ'
      }
    }, {
      coin: models.get(CurrencyId.Litecoin).logo, symbol: models.get(CurrencyId.Litecoin).ticker,
      from: '3CDJNfdWX8m2NwuGUV3nhXHXEeLygMXoAj', valid_from: '3CDJNfdWX8m2NwuGUV3nhXHXEeLygMXoAj',
      to: 'LWSygPfS6FEiDqdj2xmVF8CSZJREo4LbKd', valid_to: 'LfPZJhLRpuELaKPmtbYNEEwCXVcxk1WUdp',
      id: '1bcaac25e1fec7449e5915d54726ef35bef2beb4905549a0d7a4450404104080',
      amount: '14,88', raw_date: 1379492572, confirmations: 22, type: this.txType.In
    }, {
      coin: models.get(CurrencyId.Ethereum).logo, symbol: models.get(CurrencyId.Ethereum).ticker,
      from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      to: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH', valid_to: '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH',
      id: '651aff924e44eeef11b4bc24bfca7242f4bb87f0f8bd8dc89106c8bdcc7fb8bc',
      amount: '2,28', raw_date: 1522912572, confirmations: 30, type: this.txType.In, handled: {
        type: 'refunded'
      }
    }, {
      coin: models.get(CurrencyId.Bitcoin).logo, symbol: models.get(CurrencyId.Bitcoin).ticker,
      from: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', valid_from: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      to: '1LL87k1vMqAaMJBCR4wfy7nGivgt3hmBKG', valid_to: '1LL87k1vMqAaMJBCR4wfy7nGivgt3hmBKG',
      id: '0794d9c0fb0b5bc430cbaeea2b6e76fef551855c69ef0093c176a74c4459505e',
      amount: '13,37', raw_date: 1411482572, confirmations: 4, type: this.txType.In, handled: {
        type: 'approved', amount: 10, ticker: 'XYZ'
      }
    }];
    this.filter_name = [this.validation_types[0], this.resolution_types[0]];
  }

  ngOnInit() {
    console.log(this.blocks);
    this.transactions.sort((a, b) => {
      if (a.raw_date > b.raw_date) {
        return -1;
      }
      if (a.raw_date < b.raw_date) {
        return 1;
      }
      return 0;
    });

    const now = new Date();

    this.transactions.forEach((item) => {
      const receiving = new Date(item.raw_date * 1000);
      item.date = (receiving.getFullYear() !== now.getFullYear()) ?
        this.monthNames[receiving.getMonth()] + ' ' + receiving.getDate() + ', ' + receiving.getFullYear() :
        this.monthNames[receiving.getMonth()] + ' ' + receiving.getDate();
      if (this.investor && item.type === this.txType.Out) {
        this.output_tx.push(item);
      } else if (!this.investor && item.type === this.txType.In) {
        this.input_tx.push(item);
      }
    });
    this.filter(true);
  }

  ngOnDestroy() {

  }

  async onBack() {
    if (this.transaction) {
      this.transaction = null;
      this.title = 'Investments';
    } else {
      this.navigationService.back();
    }
  }

  popUpDetails(transaction) {
    this.transaction = transaction;
    this.title = 'Investment details';
  }

  eachTransaction(name, value) {
    this.counter = 0;
    this.filtered_input.forEach((transaction) => {
      // tslint:disable-next-line:no-eval
      transaction[name] = eval(value);
      if (name === 'chosen') {
        this.counter = (transaction.chosen) ? this.counter + 1 : this.counter;
      }
    });
  }

  longPress(e) {
    e.preventDefault();
    this.selector = !this.selector;
    if (this.selector) {
      this.filter('!transaction.handled && transaction.confirmations > 5');
      this.eachTransaction('chosen', false);
      this.notification.show('Only confirmed and unresolved transactions are displayed');
    } else {
      this.filter_name = [this.validation_types[0], this.resolution_types[0]];
      this.filter(true);
      this.selected = [];
    }
  }

  log() {
    console.log(this);
  }

  filter(criterion) {
    this.filtered_input = [];
    this.input_tx.forEach((transaction) => {
      // tslint:disable-next-line:no-eval
      if (eval(criterion)) {
        this.filtered_input.push(transaction);
      } else {
        // do nothing
      }
    });
  }

  check(e, transaction) {
    e.preventDefault();
    transaction.chosen = !transaction.chosen;
    this.counter = (transaction.chosen) ? this.counter + 1 : this.counter - 1;
  }

  structuredAddress(address) {
    let structured_address = '';
    for (let x = 0; x < address.length; x += 4) {
      structured_address += ((x + 4) < address.length) ? (address.substring(x, x + 4) + ' ') : address.substring(x, address.length);
    }
    return structured_address;
  }

  copy(address) {
    cordova.plugins.clipboard.copy(address);
    this.notification.show('Copied to clipboard');
  }
}
