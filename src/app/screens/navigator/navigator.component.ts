import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DistributedEcdsaKey, Utils } from 'crypto-core-async';
import { Subject } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval, distinctUntilChanged } from 'rxjs/operators';
import { BalanceService } from '../../services/balance.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { SyncService } from '../../services/sync.service';
import { uuidFrom } from '../../utils/uuid';
import { DeviceDiscoveryComponent } from './device-discovery/device-discovery.component';
import { RPCConnectionService } from '../../services/rpc/rpc-connection.service';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  private back = new Subject<any>();
  private resetEvent = this.syncService.resetEvent;
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
    private readonly balanceService: BalanceService,
    private readonly syncService: SyncService,
    private readonly keyChainService: KeyChainService,
    private readonly connectionService: RPCConnectionService,
    private readonly notificationService: NotificationService
  ) {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.back.next();
      })
    );

    this.subscriptions.push(
      this.back.subscribe(async () => {
        this.notificationService.show('Tap back again to exit');
      })
    );

    this.subscriptions.push(
      this.doubleBack.subscribe(async () => {
        this.notificationService.hide();
        await this.router.navigate(['/start']);
      })
    );

    this.subscriptions.push(
      this.resetEvent.subscribe( async () => {
        await this.resetKeychain();
      })
    );
  }

  public async ngOnInit() {
    await this.setKeys();
    await this.openDiscoveryOverlay();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.navigationService.clearOverlayStack();

    await this.syncService.cancel();

    await this.syncService.resetRemote(
      this.keyChainService.sessionId,
      this.connectionService.rpcClient
    );

    await this.keyChain.reset();
    await this.balanceService.reset();
    await this.syncService.reset();

    await this.connectionService.disconnect();
  }

  public async openDiscoveryOverlay() {
    const componentRef = this.navigationService.pushOverlay(DeviceDiscoveryComponent);
    componentRef.instance.connected.subscribe(async () => {
      this.navigationService.acceptOverlay();

      await this.syncing();
    });
  }

  async resetKeychain() {
    this.syncService.resynchronizing.next(true);

    await this.syncService.cancel();
    await this.syncService.resetRemote(
      this.keyChainService.sessionId,
      this.connectionService.rpcClient
    );

    await this.balanceService.reset();

    await this.setKeys();

    await this.syncing(true);

    this.syncService.resynchronizing.next(false);
  }

  async setKeys() {
    const seedHash = await Utils.sha256(this.keyChainService.seed);
    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    this.keyChainService.sessionId = uuidFrom(await Utils.sha256(Buffer.concat([seedHash, publicKey.toBytes()])));
    this.keyChainService.paillierPublicKey = publicKey;
    this.keyChainService.paillierSecretKey = secretKey;

    console.log(this.keyChainService.sessionId);
    await this.balanceService.start();
  }

  async syncing(isResync: boolean = false) {
    const resyncSubscription = this.syncService.resyncEvent.subscribe(() => {
      this.notificationService.show(
        'The remote device doesn\'t provide enough synchronized currencies. Some currencies will be re-synced'
      );
    });

    try {
      const finished = await this.syncService.sync(
        this.keyChainService.sessionId,
        this.keyChainService.paillierPublicKey,
        this.keyChainService.paillierSecretKey,
        this.connectionService.rpcClient,
        null,
        isResync
      );

      if (finished) {
        console.log('Synchronized');
        this.notificationService.show('Synchronization finished');
      }
    } catch (e) {
      console.error(e);
      this.notificationService.show('Synchronization error');
    } finally {
      resyncSubscription.unsubscribe();
    }
  }
}
