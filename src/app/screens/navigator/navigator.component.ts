import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval } from 'rxjs/operators';
import { BalanceService } from '../../services/balance.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { SyncService } from '../../services/sync.service';
import { WaitingComponent } from './waiting/waiting.component';

import { Utils, DistributedEcdsaKey } from 'crypto-core-async';
import { uuidFrom } from '../../utils/uuid';

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
    private readonly syncService: SyncService,
    private readonly keyChainService: KeyChainService
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
    const seedHash = await Utils.sha256(this.keyChainService.seed);

    this.keyChainService.sessionId = uuidFrom(seedHash);

    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    this.keyChainService.paillierPublicKey = publicKey;
    this.keyChainService.paillierSecretKey = secretKey;

    console.log(this.keyChainService.sessionId);

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
