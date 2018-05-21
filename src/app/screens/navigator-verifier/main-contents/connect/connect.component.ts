import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { toBehaviourSubject } from '../../../../utils/transformers';
import { CurrencyService, Info } from '../../../../services/currency.service';
import { Coin } from '../../../../services/keychain.service';
import { NavigationService } from '../../../../services/navigation.service';
import { WalletService } from '../../../../services/wallet.service';
import { CurrencyWallet, Status } from '../../../../services/wallet/currencywallet';

import { take, map } from 'rxjs/operators';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {
  @HostBinding('class') classes = 'box';
  stConnect = 'Synchronizing an account';
  coins = [];

  progress = this.wallet.syncProgress;
  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();
  private subscriptions = [];

  constructor(
    private wallet: WalletService,
    private readonly currencyService: CurrencyService,
    private readonly navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    for (const coin of Array.from(this.wallet.coinWallets.keys())) {
      const info = this.currencyService.getInfo(coin);
      const wallet = this.wallet.coinWallets.get(coin);

      this.subscriptions.push(
        wallet.status.pipe(
          take(1)
        ).subscribe(async () => {
          this.coins.push({
            title: info.symbol,
            synchronizing: toBehaviourSubject(wallet.status.pipe(map(status => status === Status.Synchronizing || status === Status.Ready)), false),
            ready: toBehaviourSubject(wallet.status.pipe(map(status => status === Status.Ready)), false)
          })
        })
      );
    }
  }

  async cancelSync() {
    this.cancel.emit();
  }

  async onBackClicked() {
    await this.cancelSync();
  }
}
