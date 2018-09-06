import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { SettingsService } from '../../services/settings.service';
import { PresentationComponent } from '../presentation/presentation.component';
import { KeyChainService } from '../../services/keychain.service';

import { PlainServerSocket } from '../../utils/sockets/plainserversocket';
import { PlainSocket } from '../../utils/sockets/plainsocket';
import { Client, Server } from '../../utils/client-server/client-server';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { RPCClient } from '../../services/rpc/rpc-client';

import uuid from 'uuid/v5';

import {
  Utils,
  DistributedEcdsaKey,
  EcdsaInitialData,
  EcdsaChallengeCommitment,
  EcdsaChallengeDecommitment,
  Curve
} from 'crypto-core-async';
import { CurrencyInfoService, CurrencyId } from '../../services/currencyinfo.service';

declare const navigator: any;
declare const Windows: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit, OnDestroy {
  public ready = false;
  public isWindows = null;
  private buffer = null;
  private subscriptions = [];

  constructor(
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly navigationService: NavigationService,
    private readonly settings: SettingsService,
    private readonly rpc: RPCServerService,
    private readonly keyChainService: KeyChainService,
    private readonly currencyInfoService: CurrencyInfoService
  ) {}

  public async ngOnInit() {
    await this.deviceService.deviceReady();

    await this.settings.initializeSettings();

    const viewed = await this.settings.presentationViewed();

    if (!viewed) {
      this.openPresentation();
    }

    this.ready = true;
    this.isWindows = this.deviceService.platform === Platform.Windows;

    if (this.isWindows) {
      this.router.events
        .subscribe((event) => {
          if (event instanceof NavigationStart) {
            const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
            currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.visible;
          }
        });
    }

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        navigator.app.exitApp();
      })
    );

    if (this.isWindows) {
      const currentView = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
      currentView.appViewBackButtonVisibility = Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
    }

    this.buffer = Buffer;
    this.keyChainService.reset();

    const startPath = await this.settings.startPath();
    if (startPath !== null) {
      await this.router.navigate([startPath as string]);
    }

    this.keyChainService.seed = Buffer.from(
      '9ff992e811d4b2d2407ad33b263f567698c37bd6631bc0db90223ef10bce7dca28b8c670522667451430a1cb10d1d6b114234d1c2220b2f4229b00cadfc91c4d',
      'hex'
    );

    await this.rpc.start('0.0.0.0', 5666);

    console.log('Rpc started');
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.rpc.stop();
  }

  public openPresentation() {
    const componentRef = this.navigationService.pushOverlay(PresentationComponent, Position.Fullscreen);
    componentRef.instance.finished.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.settings.setPresentationViewed(true);
    });
    componentRef.instance.skipped.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.settings.setPresentationViewed(true);
    });
  }

  public async onOpenClicked() {
    try {
      await this.settings.setStartPath('/login');
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/login']);
  }

  public async onConnectClicked() {
    try {
      await this.settings.setStartPath('/verifier-auth');
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/verifier-auth']);
  }

  public async test() {
    const socket = new PlainSocket();
    const rpcClient = new RPCClient(new Client(socket));

    await socket.open('127.0.0.1', 5666);

    const capabilities = await rpcClient.api.capabilities({});

    console.log(capabilities);

    const seedHash = await Utils.randomBytes(32);

    const serviceId = '57b23ea7-26b9-47c4-bd90-eb0664df26a0';

    const sessionId = uuid(seedHash.toJSON().data, serviceId);

    console.log(sessionId);

    const registerResponse = await rpcClient.api.registerSession({ sessionId });

    console.log(registerResponse);

    const syncStatusResponse = await rpcClient.api.syncStatus({ sessionId });

    console.log(syncStatusResponse);

    const currencyId = CurrencyId.Bitcoin;

    const derivationNumber = this.currencyInfoService.currencyInfo(currencyId).derivationNumber;

    const privateBytes = this.keyChainService.privateBytes(derivationNumber, 0);

    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    const distributedKey = await DistributedEcdsaKey.fromOptions({
      curve: Curve.secp256k1,
      secret: privateBytes,
      localPaillierPublicKey: publicKey,
      localPaillierSecretKey: secretKey,
    });

    const syncSession = await distributedKey.startSyncSession();

    const initialCommitment = await syncSession.createInitialCommitment();

    const startSyncResponse = await rpcClient.api.startSync({
      sessionId,
      currencyId,
      initialCommitment: initialCommitment.toJSON()
    });
    console.log(startSyncResponse);

    const initiaalData = EcdsaInitialData.fromJSON(startSyncResponse.initialData);

    const initialDecommitment = await syncSession.processInitialData(initiaalData);

    const syncRevealResponse = await rpcClient.api.syncReveal({
      sessionId,
      currencyId,
      initialDecommitment: initialDecommitment.toJSON()
    });
    console.log(syncRevealResponse);

    const challengeCommitment = EcdsaChallengeCommitment.fromJSON(syncRevealResponse.challengeCommitment);

    const responseCommitment = await syncSession.processChallengeCommitment(challengeCommitment);

    const syncResponseResponse = await rpcClient.api.syncResponse({
      sessionId,
      currencyId,
      responseCommitment: responseCommitment.toJSON()
    });
    console.log(syncResponseResponse);

    const challengeDecommitment = EcdsaChallengeDecommitment.fromJSON(syncResponseResponse.challengeDecommitment);

    const { responseDecommitment, syncData } = await syncSession.processChallengeDecommitment(challengeDecommitment);

    const syncFinalizeResponse = await rpcClient.api.syncFinalize({
      sessionId,
      currencyId,
      responseDecommitment: responseDecommitment.toJSON()
    });
    console.log(syncFinalizeResponse);

    await distributedKey.importSyncData(syncData);

    console.log(distributedKey.compoundPublic());

    const syncStateResponse = await rpcClient.api.syncState({ sessionId, currencyId });

    console.log(syncStateResponse);

    const clearResponse = await rpcClient.api.clearSession({ sessionId });

    console.log(clearResponse);

    await rpcClient.close();
  }
}
