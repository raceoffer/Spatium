import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BluetoothService } from '../../services/bluetooth.service';
import { WalletService } from '../../services/wallet.service';
import { KeyChainService } from "../../services/keychain.service";
import { NavigationService } from "../../services/navigation.service";
import { bufferWhen, map, timeInterval, filter, skipUntil} from 'rxjs/operators';
import { Subject } from "rxjs/index";
import { NotificationService } from "../../services/notification.service";
import { SettingsComponent } from "./settings/settings.component";
import { FeedbackComponent } from '../feedback/feedback.component';
import { ActivityService } from "../../services/activity.service";
import { WaitingComponent } from "./waiting/waiting.component";

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  public navLinks = [{
    name: 'Wallet',
    clicked: async () => {
      this.current = 'Wallet';
      await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}])
    }
  }, {
    name: 'Exchange'
  }, {
    name: 'ICO',
    clicked: async () => {
      this.current = 'ICO';
      await this.router.navigate(['/navigator', {outlets: {navigator: ['ico']}}])
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
      await this.router.navigate(['/start'])
    }
  }];

  public current = 'Wallet';
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

  @ViewChild('sidenav') sidenav;

  constructor(
    private readonly wallet: WalletService,
    private readonly keychain: KeyChainService,
    private readonly router: Router,
    private readonly bt: BluetoothService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly activityService: ActivityService
  ) {
    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        await this.wallet.startHandshake();
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.wallet.cancelEvent.subscribe(async () => {
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
    if (!this.bt.connected.getValue()) {
      await this.openConnectOverlay();
    }
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connected.subscribe(device => {
      this.navigationService.acceptOverlay();
      console.log('Connected to', device);
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
    await this.bt.disconnect();
  }
}
