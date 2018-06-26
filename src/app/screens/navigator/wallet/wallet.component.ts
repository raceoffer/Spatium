import { Component, Input, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { CurrencyService } from '../../../services/currency.service';
import { Coin, KeyChainService} from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBehaviourSubject } from '../../../utils/transformers';
import { CurrencyComponent } from "../currency/currency.component";
import { BluetoothService } from "../../../services/bluetooth.service";

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component';

  private tileBalanceInfo = {};

  @Input() filtredTitles: any;
  @Input() cols: any;

  constructor(
    private readonly keychain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly currency: CurrencyService,
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService
  ) {  }

  async ngOnInit() {
    console.log(this);
  }

  public async onTileClicked(coin: Coin) {
    const componentRef = this.navigationService.pushOverlay(CurrencyComponent);
    componentRef.instance.currency = coin;
  }

  public getTileBalanceInfo(coin: any) {
    if (coin === undefined || coin === null) {
      return undefined;
    }

    if (this.tileBalanceInfo[coin] !== undefined) {
      return this.tileBalanceInfo[coin];
    }

    const currencyInfo = this.currency.getInfo(coin);
    const currencyWallet = this.wallet.currencyWallets.get(coin);
    const balanceUnconfirmed = toBehaviourSubject(
      currencyWallet.balance.pipe(map(balance => balance ? currencyWallet.fromInternal(balance.unconfirmed) : null)),
      null);
    this.tileBalanceInfo[coin] = {
      balance: balanceUnconfirmed,
      balanceUSD: toBehaviourSubject(combineLatest(
        balanceUnconfirmed,
        currencyInfo.rate,
        (balance, rate) => {
          if (rate === null || balance === null) {
            return null;
          }
          return balance * rate;
        }), null)
    };

    return this.tileBalanceInfo[coin];
  }
}