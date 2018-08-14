import { Component, HostBinding, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NotificationService } from '../../../../services/notification.service';
import { Coin, Token } from '../../../../services/keychain.service';
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
export class WhitelistComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;

  title = 'Whitelist';
  coins: any;
  confirmed_coins: any = [];
  chosencoins: any = [];
  next = false;

  cols = Math.ceil(window.innerWidth / 350);

  public isWindows = false;

  constructor(
    private readonly wallet: WalletService,
    private readonly navigationService: NavigationService,
    private readonly currency: CurrencyService,
    private readonly device: DeviceService,
    private readonly notification: NotificationService
  ) {
    this.coins = [
      Coin.BTC,
      Coin.BCH,
      Coin.ETH,
      Coin.LTC,
      Coin.BTC_test
    ];
    this.isWindows = (this.device.platform === Platform.Windows);
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

  getBalance(coin: Coin | Token) {
    const currencyWallet = this.wallet.currencyWallets.get(coin);

    return (!!currencyWallet.balance.getValue().unconfirmed) ? currencyWallet.balance.getValue().unconfirmed.toFixed(6) : 0;
  }

  public getTileModel(currency: Coin | Token) {
    if (currency === undefined || currency === null) {
      return undefined;
    }

    const currencyInfo = this.currency.getInfo(currency);

    const tileModel: any = {
      title: currencyInfo.name,
      symbols: currencyInfo.symbol,
      logo: currencyInfo.icon,
      coin: currency,
      erc20: currency in Token
    };

    if (this.wallet.currencyWallets.has(currency)) {
      const currencyWallet = this.wallet.currencyWallets.get(currency);

      const balanceUnconfirmed = toBehaviourSubject(
        currencyWallet.balance.pipe(map(balance => balance ? currencyWallet.fromInternal(balance.unconfirmed) : null)),
        null);

      tileModel.implemented = true;
      tileModel.status = currencyWallet.status;
      tileModel.balanceStatus = currencyWallet.balanceStatus;
      tileModel.balance = balanceUnconfirmed;
      tileModel.balanceUSD = toBehaviourSubject(combineLatest([
        balanceUnconfirmed,
        currencyInfo.rate
      ]).pipe(map(
        ([balance, rate]) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }
      )), null);
    }

    return tileModel;
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
      this.notification.show('Choose at least one coin');
    } else {
      console.log(e);
      this.next = !this.next;
    }
  }

  verifyAmount(e, coin) {
    if (coin.amount > + this.getBalance(coin.coin)) {
      this.notification.show('Insufficient funds');
    } else {
      // do nothing
    }
  }

  async participateProject(e) {
    // do something
    console.log(this);
  }
}
