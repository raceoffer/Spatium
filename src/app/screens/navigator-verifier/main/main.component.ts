import { Component, HostBinding, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { WalletService } from '../../../services/wallet.service';
import { BluetoothService } from "../../../services/bluetooth.service";
import { NotificationService } from "../../../services/notification.service";
import { NavigationService } from "../../../services/navigation.service";

enum State {
  None,
  Preparing,
  Verifying
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component content';
  isOpened = false;

  address = '';
  btc;
  usd;
  fee;
  feeUsd;

  public title = 'Confirmations mode';
  public navLinks = [{
    name: 'Export secret',
    link: ['/navigator-verifier', {outlets: {'navigator': ['secret-export']}}],
    isSelected: false,
    isActive: true
  }, {
    name: 'Change PIN',
    link: null,
    isSelected: false,
    isActive: false
  }, {
    name: 'Delete secret',
    link: ['/navigator-verifier', {outlets: {'navigator': ['delete-secret', 'main']}}],
    isSelected: false,
    isActive: true
  }, {
    name: 'Exit',
    link: ['/start'],
    isSelected: false,
    isActive: true
  }];

  public stateType: any = State;
  public state: State = State.None;

  public currentCoin: Coin | Token = null;
  public currentInfo: Info = null;
  public currencyWallets = this.wallet.currencyWallets;
  public isExitTap = false;
  enabledBT = this.bt.enabled;
  synchronizing = this.wallet.synchronizing;
  partiallySync = this.wallet.partiallySync;
  fullySync = this.wallet.fullySync;
  progress = this.wallet.syncProgress;
  @ViewChild('sidenav') sidenav;
  private subscriptions = [];

  constructor(private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly bt: BluetoothService,
              private readonly navigationService: NavigationService,
              private readonly notification: NotificationService,
              private readonly wallet: WalletService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onNav(navLink) {
    await this.router.navigate(navLink.link);
  }

  public toggle() {
    this.isOpened = !this.isOpened;
  }

  async confirm() {
    this.state = State.None;
    await this.currencyWallets.get(this.currentCoin).acceptTransaction();
  }

  async decline() {
    this.state = State.None;
    await this.currencyWallets.get(this.currentCoin).rejectTransaction();
  }

  async onBackClicked() {
    if (this.isOpened) {
      console.log('isOpened');
      this.sidenav.toggle();
    } else if (this.isExitTap) {
      console.log('isExitTap');
      this.notification.hide();
      await this.router.navigate(['/start']);
    } else {
      console.log('await');
      this.notification.show('Tap again to exit');
      this.isExitTap = true;
      setTimeout(() => this.ngZone.run(() => {
        this.isExitTap = false;
      }), 3000);
    }
  }

  async cancelConnect() {
    await this.wallet.cancelSync();
  }

}
