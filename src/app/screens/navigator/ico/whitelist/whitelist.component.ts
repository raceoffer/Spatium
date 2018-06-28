import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NotificationService } from '../../../../services/notification.service';
import { Coin } from '../../../../services/keychain.service';
import { WalletService } from '../../../../services/wallet.service';
import { CurrencyService } from '../../../../services/currency.service';
import { NavigationService } from '../../../../services/navigation.service';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBehaviourSubject } from '../../../../utils/transformers';
import { IcoDetailsComponent } from '../ico-details/ico-details.component';

@Component({
  selector: 'app-whitelist',
  templateUrl: './whitelist.component.html',
  styleUrls: ['./whitelist.component.css']
})
export class WhitelistComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;
  title: string = 'Whitelist';
  coins: any;
  confirmed_coins: any = [];
  chosencoins: any = [];
  next: boolean = false;

  private balanceInfo: any = {};

  constructor(private readonly wallet: WalletService,
              private readonly navigationService: NavigationService,
              private readonly currency: CurrencyService,
              private readonly notification: NotificationService) {
    this.coins = [
      {title: 'Bitcoin', symbols: 'BTC', logo: 'bitcoin', coin: Coin.BTC, chosen: false},
      {title: 'Bitcoin Cash', symbols: 'BCH', logo: 'bitcoin-cash', coin: Coin.BCH, chosen: false},
      {title: 'Ethereum', symbols: 'ETH', logo: 'ethereum', coin: Coin.ETH, chosen: false},
      {title: 'Litecoin', symbols: 'LTC',logo: 'litecoin', coin: Coin.LTC, chosen: false},
      {title: 'Cardano', symbols: 'ADA', logo: 'cardano', chosen: false},
      {title: 'NEO', symbols: 'NEO', logo: 'neo', chosen: false},
      {title: 'Ripple', symbols: 'XRP', logo: 'ripple', chosen: false},
      {title: 'Stellar', symbols: 'XLM', logo: 'stellar', chosen: false},
      {title: 'NEM', symbols: 'XEM', logo: 'nem', chosen: false},
      {title: 'Bitcoin Test', symbols: 'BTC_test', logo: 'bitcoin', coin: Coin.BTC_test, chosen: false},
    ];
  }

  ngOnInit() {

  }

  ngOnDestroy() {

  }

  async onBack() {
    if (this.next) {
      this.next = !this.next;
      this.chosencoins = [];
      this.confirmed_coins = [];
    } else {
      this.navigationService.back();
    }
  }

  getBalance(coin: any) {
    if (coin === undefined || coin === null) {
      return 0;
    }

    if (this.balanceInfo[coin] !== undefined) {
      return (!!this.balanceInfo[coin].balance.value)?this.balanceInfo[coin].balance.value.toFixed(6):0;
    }

    const currencyInfo = this.currency.getInfo(coin);
    const currencyWallet = this.wallet.currencyWallets.get(coin);
    const balanceConfirmed = toBehaviourSubject(
      currencyWallet.balance.pipe(map(balance => balance ? currencyWallet.fromInternal(balance.confirmed) : null)),
      null);
    this.balanceInfo[coin] = {
      balance: balanceConfirmed,
      balanceUSD: toBehaviourSubject(combineLatest(
        balanceConfirmed,
        currencyInfo.rate,
        (balance, rate) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }), null)
    };

    console.log(this.balanceInfo[coin]);

    return (!!this.balanceInfo[coin].balance.value)?this.balanceInfo[coin].balance.value.toFixed(6):0;
  }

  click(coin) {
    coin.chosen = !coin.chosen;
  }

  async nextScreen(e) {
    this.coins.forEach((item, i) => {
      if (item.chosen) {
        item.amount = new FormControl(undefined);
        this.chosencoins.push(item);
      }
    });
    if (this.chosencoins.length === 0) {
      this.notification.show("Choose at least one coin");
    } else {
      console.log(e);
      this.next = !this.next;
    }
  }

  verifyAmount(e, coin) {
    if (coin.amount > +this.getBalance(coin.coin)) {
      this.notification.show("Insufficient funds");
    } else {
      //do nothing
    }
  }

  async participateProject(e) {
    //do something
    console.log(this);
  }
}
