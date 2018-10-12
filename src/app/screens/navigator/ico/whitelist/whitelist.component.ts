import { Component, HostBinding, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CurrencyId, CurrencyInfoService } from '../../../../services/currencyinfo.service';
import { DeviceService, Platform } from '../../../../services/device.service';
import { NavigationService } from '../../../../services/navigation.service';
import { NotificationService } from '../../../../services/notification.service';
import { CurrencyModel } from '../../../../services/wallet/wallet';

@Component({
  selector: 'app-whitelist',
  templateUrl: './whitelist.component.html',
  styleUrls: ['./whitelist.component.css']
})
export class WhitelistComponent {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public project: any = null;

  public title = 'Whitelist';
  public tiles = new Array<CurrencyModel>();

  public toggledCoins = new Map<CurrencyModel, boolean>();
  public chosenCoins =  new Array<CurrencyModel>();

  next = false;

  cols = Math.ceil(window.innerWidth / 350);

  public isWindows = false;

  constructor(
    private readonly device: DeviceService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly currencyInfoService: CurrencyInfoService
  ) {
    this.tiles.push(
      ... [
        CurrencyId.Bitcoin,
        CurrencyId.Litecoin,
        CurrencyId.BitcoinCash,
        CurrencyId.Ethereum,
        CurrencyId.Neo
      ].map((currencyId) => {
        return CurrencyModel.fromCoin(this.currencyInfoService.currencyInfo(currencyId));
      })
    );

    this.isWindows = (this.device.platform === Platform.Windows);
  }

  async onBack() {
    if (this.next) {
      this.next = !this.next;
      this.chosenCoins = [];
    } else {
      this.navigationService.back();
    }
  }

  toggled(model: CurrencyModel, toggled: boolean) {
    this.toggledCoins.set(model, toggled);
  }

  async nextScreen(e) {
    this.chosenCoins =
      Array.from(this.toggledCoins.entries())
        .filter(([_, toggled]) => toggled)
        .map(([currencyId, _]) => currencyId);
    if (this.chosenCoins.length === 0) {
      this.notification.show('Choose at least one coin');
    } else {
      console.log(e);
      this.next = !this.next;
    }
  }

  verifyAmount(e, coin) {
    // if (coin.amount > + this.getBalance(coin.coin)) {
    //   this.notification.show('Insufficient funds');
    // } else {
    //   // do nothing
    // }
  }

  async participateProject(e) {
    // do something
    console.log(this);
  }
}
