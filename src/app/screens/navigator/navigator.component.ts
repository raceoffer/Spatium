import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval } from 'rxjs/operators';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WaitingComponent } from './waiting/waiting.component';
import { BalanceService } from '../../services/balance.service';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { SyncService } from '../../services/sync.service';
import { CurrencyInfoService } from '../../services/currencyinfo.service';

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
    private readonly keyChain: KeyChainService,
    private readonly router: Router,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly balanceService: BalanceService,
    private readonly rpcService: RPCServerService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly syncService: SyncService
  ) {
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
  }

  public async ngOnInit() {
    await this.balanceService.start();
    await this.rpcService.start('0.0.0.0', 5666);
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.navigationService.clearOverlayStack();

    await this.keyChain.reset();

    await this.balanceService.reset();
    await this.syncService.reset();
    await this.rpcService.stop();
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connectedEvent.subscribe(() => {
      this.navigationService.acceptOverlay();
    });
  }
}
