import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';
import { KeyChainService } from "../../services/keychain.service";
import { NavigationService } from "../../services/navigation.service";
import { bufferWhen, map, debounceTime, filter } from "rxjs/operators";
import { Subject } from "rxjs/index";
import { NotificationService } from "../../services/notification.service";
import { SettingsComponent } from "./settings/settings.component";

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnDestroy {
  private subscriptions = [];

  public navLinks = [{
    name: 'Wallet',
    clicked: async () => {
      await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}])
    }
  }, {
    name: 'Exchange'
  }, {
    name: 'ICO'
  }, {
    name: 'Portfolio Investment'
  }, {
    name: 'Verification'
  }, {
    name: 'Settings',
    clicked: () => {
      this.openSettings();
    }
  }, {
    name: 'Exit',
    clicked: async () => {
      await this.router.navigate(['/start'])
    }
  }];

  public current = 'Wallet';

  private back = new Subject<any>();
  public  doubleBack = this.back.pipe(
    bufferWhen(() => this.back.pipe(
      debounceTime(3000)
    )),
    map(emits => emits.length),
    filter(emits => emits > 1)
  );

  @ViewChild('sidenav') sidenav;

  constructor(
    private readonly wallet: WalletService,
    private readonly keychain: KeyChainService,
    private readonly router: Router,
    private readonly bt: BluetoothService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService
  ) {
    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.wallet.resyncEvent.subscribe(async () => {
        await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
      }));

    this.subscriptions.push(
      this.wallet.cancelResyncEvent.subscribe(async () => {
        await this.bt.disconnect();
      }));

    this.subscriptions.push(
      this.navigationService.navigationEvent.subscribe(() => {
        this.toggleNavigation();
      })
    );

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.back.next();
      })
    );

    this.subscriptions.push(
      this.doubleBack.subscribe(async () => {
        this.notification.hide();
        await this.router.navigate(['/start']);
      })
    );
  }

  public openSettings() {
    const componentRef = this.navigationService.pushOverlay(SettingsComponent);
  }

  public toggleNavigation() {
    this.sidenav.toggle();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.wallet.reset();
    await this.keychain.reset();
    await this.wallet.resetSession();
    await this.bt.disconnect();
  }
}
