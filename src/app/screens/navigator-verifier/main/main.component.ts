import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CurrencyService, Info } from '../../../services/currency.service';
import { Coin, Token } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WalletService } from '../../../services/wallet.service';

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
  synchronizing = this.wallet.synchronizing;
  ready = this.wallet.ready;
  @ViewChild('sidenav') sidenav;
  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly wallet: WalletService) { }

  ngOnInit() {}

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
      this.sidenav.toggle();
    }
  }

  async goToSync() {
    await this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['main']}}]);
  }

  async cancelConnect() {
    await this.wallet.cancelSync();
  }

}
