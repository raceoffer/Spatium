import { Component, EventEmitter, HostBinding, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { WalletService } from '../../../services/wallet.service';
import { CurrencyService } from '../../../services/currency.service';
import { Status } from '../../../services/wallet/currencywallet';

@Component({
  selector: 'app-syncronization',
  templateUrl: './syncronization.component.html',
  styleUrls: ['./syncronization.component.css']
})
export class SyncronizationComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Output() public cancelled = new EventEmitter<any>();

  public synchronizing = this.wallet.synchronizing;
  public progress = this.wallet.syncProgress;

  public coinStatusType = Status;
  public synchedCoins = [];

  private subscriptions = [];

  constructor(
    private readonly navigationService: NavigationService,
    private readonly currencyService: CurrencyService,
    private readonly wallet: WalletService) {
  }

  public async ngOnInit() {
    for (const wallet of Array.from(this.wallet.coinWallets.values())) {
      this.subscriptions.push(
        wallet.status.subscribe(() => {
          const coins = [];

          for (const coin of Array.from(this.wallet.coinWallets.keys())) {
            const status = this.wallet.coinWallets.get(coin).status.getValue();

            if (status === Status.Synchronizing || status === Status.Ready) {
              const info = this.currencyService.getInfo(coin);
              coins.push({
                name: info.name,
                status: this.wallet.coinWallets.get(coin).status.getValue()
              });
            }
          }

          this.synchedCoins = coins;
        })
      );
    }
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public cancel() {
    this.cancelled.next();
  }

  onBack() {
    this.navigationService.back();
  }
}
