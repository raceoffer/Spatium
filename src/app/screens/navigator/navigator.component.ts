import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import BN from 'bn.js';
import { DistributedEcdsaKey, Utils } from 'crypto-core-async';
import { Subject } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval } from 'rxjs/operators';
import { BalanceService } from '../../services/balance.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { SyncService } from '../../services/sync.service';
import { VerifierService } from '../../services/verifier.service';
import { CurrencyModel } from '../../services/wallet/wallet';
import { uuidFrom } from '../../utils/uuid';
import { VerifyTransactionComponent } from '../verifier/verify-transaction/verify-transaction.component';
import { WaitingComponent } from './waiting/waiting.component';

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
    private readonly keyChainService: KeyChainService,
    private readonly verifierService: VerifierService
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

    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    this.keyChainService.sessionId = uuidFrom(await Utils.sha256(Buffer.concat([seedHash, publicKey.toBytes()])));
    this.keyChainService.paillierPublicKey = publicKey;
    this.keyChainService.paillierSecretKey = secretKey;

    console.log(this.keyChainService.sessionId);

    await this.balanceService.start();

    this.verifierService.setAcceptHandler(
      async (sessionId, model, address, value, fee) => await this.accept(sessionId, model, address, value, fee)
    );

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

  public async accept(sessionId: string, model: CurrencyModel, address: string, value: BN, fee: BN): Promise<boolean> {
    return new Promise<boolean>((resolve, ignored) => {
      const componentRef = this.navigationService.pushOverlay(VerifyTransactionComponent);
      componentRef.instance.sessionId = sessionId;
      componentRef.instance.model = model;
      componentRef.instance.address = address;
      componentRef.instance.valueInternal = value;
      componentRef.instance.feeInternal = fee;

      componentRef.instance.confirm.subscribe(async () => {
        this.navigationService.acceptOverlay();
        resolve(true);
      });
      componentRef.instance.decline.subscribe(async () => {
        this.navigationService.acceptOverlay();
        resolve(false);
      });
      componentRef.instance.cancelled.subscribe(async () => {
        this.navigationService.acceptOverlay();
        resolve(false);
      });
    });
  }

  public async openConnectOverlay() {
    const componentRef = this.navigationService.pushOverlay(WaitingComponent);
    componentRef.instance.connectedEvent.subscribe(() => {
      this.navigationService.acceptOverlay();
    });
  }
}
