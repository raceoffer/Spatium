import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval, distinctUntilChanged, skip } from 'rxjs/operators';
import { ActivityService } from '../../services/activity.service';
import { ConnectionProviderService } from '../../services/connection-provider';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { WaitingComponent } from './waiting/waiting.component';
import { ConnectionState } from '../../services/primitives/state';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
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

  constructor(
    private readonly wallet: WalletService,
    private readonly keychain: KeyChainService,
    private readonly router: Router,
    private readonly connectionProviderService: ConnectionProviderService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly activityService: ActivityService
  ) {
    this.subscriptions.push(
      this.connectionProviderService.connectionState.pipe(
        map(state => state === ConnectionState.Connected),
        distinctUntilChanged(),
        skip(1),
        filter(connected => connected)
      ).subscribe(async () => {
        await this.wallet.startHandshake();
        await this.wallet.startSync();
      }));

    this.subscriptions.push(
      this.connectionProviderService.connectionState.pipe(
        map(state => state !== ConnectionState.Connected),
        distinctUntilChanged(),
        skip(1),
        filter(disconnected => disconnected)
      ).subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.wallet.cancelEvent.subscribe(async () => {
        await this.connectionProviderService.disconnect();
      }));

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
    if (this.connectionProviderService.connectionState.getValue() === ConnectionState.None) {
      await this.openConnectOverlay();
    }
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connectedEvent.subscribe(() => {
      this.navigationService.acceptOverlay();
    });
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.navigationService.clearOverlayStack();

    await this.wallet.reset();
    await this.keychain.reset();
    await this.connectionProviderService.reset();
  }
}
