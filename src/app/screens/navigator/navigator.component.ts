import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/index';
import { bufferWhen, filter, map, skipUntil, timeInterval } from 'rxjs/operators';
import { ActivityService } from '../../services/activity.service';
import { ConnectionProviderService } from '../../services/connection-provider';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { FeedbackComponent } from '../feedback/feedback.component';
import { SettingsComponent } from './settings/settings.component';
import { WaitingComponent } from './waiting/waiting.component';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  public current = 'Wallet';
  public navLinks = [{
    name: 'Wallet',
    clicked: async () => {
      this.current = 'Wallet';
      await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
    }
  }, {
    name: 'Exchange'
  }, {
    name: 'ICO',
    clicked: async () => {
      this.current = 'ICO';
      await this.router.navigate(['/navigator', {outlets: {navigator: ['ico']}}]);
    }
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
    name: 'Feedback',
    clicked: () => {
      this.openFeedback();
    }
  }, {
    name: 'Exit',
    clicked: async () => {
      await this.router.navigate(['/start']);
    }
  }];
  @ViewChild('sidenav') sidenav;
  private subscriptions = [];
  private back = new Subject<any>();
  public doubleBack = this.back.pipe(
    bufferWhen(() => this.back.pipe(
      skipUntil(this.back),
      timeInterval(),
      filter(time => time.interval < 3000)
    )),
    map(emits => emits.length),
    filter(emits => emits > 0)
  );

  constructor(private readonly wallet: WalletService,
              private readonly keychain: KeyChainService,
              private readonly router: Router,
              private readonly connectionProviderService: ConnectionProviderService,
              private readonly navigationService: NavigationService,
              private readonly notification: NotificationService,
              private readonly activityService: ActivityService) {
    this.subscriptions.push(
      this.connectionProviderService.connectedEvent.subscribe(async () => {
        await this.wallet.startHandshake();
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.connectionProviderService.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.wallet.cancelEvent.subscribe(async () => {
        await this.connectionProviderService.disconnect();
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
      this.back.subscribe(async () => {
        this.notification.show('Tap back again to exit');
      })
    );

    this.subscriptions.push(
      this.doubleBack.subscribe(async () => {
        this.notification.hide();
        await this.router.navigate(['/start']);
      })
    );

    this.subscriptions.push(
      this.activityService.inactivity.subscribe(async () => {
        await this.router.navigate(['/start']);
      })
    );

    this.activityService.onActivity();
  }

  async ngOnInit() {
    if (!this.connectionProviderService.connected.getValue()) {
      await this.openConnectOverlay();
    }
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connected.subscribe(() => {
      this.navigationService.acceptOverlay();
    });
  }

  public openSettings() {
    const componentRef = this.navigationService.pushOverlay(SettingsComponent);
  }

  public openFeedback() {
    const componentRef = this.navigationService.pushOverlay(FeedbackComponent);
  }

  public toggleNavigation() {
    this.sidenav.toggle();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.navigationService.clearOverlayStack();

    await this.wallet.reset();
    await this.keychain.reset();
    await this.connectionProviderService.disconnect();
  }
}
