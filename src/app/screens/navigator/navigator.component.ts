import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DistributedEcdsaKey, Utils } from 'crypto-core-async';
import { Subject } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval } from 'rxjs/operators';
import { BalanceService } from '../../services/balance.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { SyncService } from '../../services/sync.service';
import { uuidFrom } from '../../utils/uuid';
import { DeviceDiscoveryComponent } from './device-discovery/device-discovery.component';
import { RPCConnectionService } from '../../services/rpc/rpc-connection.service';
import { Provider } from '../../services/primitives/device';

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
  }

  public async ngOnInit() {
    const seedHash = await Utils.sha256(this.keyChainService.seed);

    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    this.keyChainService.sessionId = uuidFrom(await Utils.sha256(Buffer.concat([seedHash, publicKey.toBytes()])));
    this.keyChainService.paillierPublicKey = publicKey;
    this.keyChainService.paillierSecretKey = secretKey;

    console.log(this.keyChainService.sessionId);

    await this.balanceService.start();

    await this.openDiscoveryOverlay();
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.navigationService.clearOverlayStack();

    await this.keyChain.reset();

    await this.balanceService.reset();
    await this.syncService.reset();
  }

  public async openDiscoveryOverlay() {
    const componentRef = this.navigationService.pushOverlay(DeviceDiscoveryComponent);
    componentRef.instance.selected.subscribe(async (device) => {
      this.navigationService.acceptOverlay();
      try {
        switch (device.provider) {
          case Provider.Bluetooth:
            await this.connectionService.connectBluetooth(device.data);
            break;
          case Provider.Wifi:
            await this.connectionService.connectPlain(device.data);
            break;
          }
        } catch (e) {
          console.error(e);
          this.notificationService.show('Failed to conenct to remote device');
          return;
        }

        try {
        await this.syncService.sync(
          this.keyChainService.sessionId,
          this.keyChainService.paillierPublicKey,
          this.keyChainService.paillierSecretKey,
          this.connectionService.rpcClient
        );

        console.log('Synchronized');
      } catch (e) {
        console.error(e);
        this.notificationService.show('Synchronization error');
      }
    });
  }
}
