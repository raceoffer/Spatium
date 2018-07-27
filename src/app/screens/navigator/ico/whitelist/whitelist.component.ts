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
import { DeviceService, Platform } from '../../../../services/device.service';

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
  cols: any = Math.ceil(window.innerWidth / 350);
  synchronizing = this.wallet.synchronizing;

  public isWindows;

  private balanceInfo: any = {};

  constructor(private readonly wallet: WalletService,
              private readonly navigationService: NavigationService,
              private readonly currency: CurrencyService,
              private readonly device: DeviceService,
              private readonly notification: NotificationService) {
    this.coins = [
      {title: 'Bitcoin', symbols: 'BTC', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC, chosen: false},
      {title: 'Bitcoin Cash', symbols: 'BCH', cols: 1, rows: 1, logo: 'bitcoin-cash', coin: Coin.BCH, chosen: false},
      {title: 'Ethereum', symbols: 'ETH', cols: 1, rows: 1, logo: 'ethereum', coin: Coin.ETH, chosen: false},
      {title: 'Litecoin', symbols: 'LTC', cols: 1, rows: 1, logo: 'litecoin', coin: Coin.LTC, chosen: false},
      {title: 'Bitcoin Test', symbols: 'BTC_test', cols: 1, rows: 1, logo: 'bitcoin', coin: Coin.BTC_test, chosen: false},
    ];
    this.isWindows = (this.device.platform === Platform.Windows);
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
    this.balanceInfo[coin] = this.getTileBalanceInfo(coin);

    return (!!this.balanceInfo[coin].balance.value) ? this.balanceInfo[coin].balance.value.toFixed(6) : 0;
  }

  public getTileBalanceInfo(coin: any) {
    if (coin === undefined || coin === null) {
      return undefined;
    }

    if (this.balanceInfo[coin] !== undefined) {
      return this.balanceInfo[coin];
    }

    const currencyInfo = this.currency.getInfo(coin);
    const currencyWallet = this.wallet.currencyWallets.get(coin);

    const balanceUnconfirmed = toBehaviourSubject(
      currencyWallet.balance.pipe(map(balance => balance ? currencyWallet.fromInternal(balance.unconfirmed) : null)),
      null);

    this.balanceInfo[coin] = {
      balance: balanceUnconfirmed,
      balanceUSD: toBehaviourSubject(combineLatest([
        balanceUnconfirmed,
        currencyInfo.rate
      ]).pipe(map(
        ([balance, rate]) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }
      )), null)
    };

    return this.balanceInfo[coin];
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
      // do nothing
    }
  }

  async participateProject(e) {
    // do something
    console.log(this);
  }
}
