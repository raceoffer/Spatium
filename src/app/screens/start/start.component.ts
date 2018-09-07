import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { SettingsService } from '../../services/settings.service';
import { PresentationComponent } from '../presentation/presentation.component';
import { KeyChainService } from '../../services/keychain.service';

import { PlainSocket } from '../../utils/sockets/plainsocket';
import { Client } from '../../utils/client-server/client-server';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { RPCClient } from '../../services/rpc/rpc-client';

import uuid from 'uuid/v5';

import {
  Utils,
  DistributedEcdsaKey,
  BitcoinWallet,
  BitcoinTransaction,
  Marshal
} from 'crypto-core-async';
import { CurrencyId } from '../../services/currencyinfo.service';
import { SyncService, EcdsaCurrency } from '../../services/sync.service';
import { SyncState } from '../../services/verifier.service';

declare const navigator: any;
declare const Windows: any;

const serviceId = '57b23ea7-26b9-47c4-bd90-eb0664df26a0';

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

  private socket: PlainSocket;
  private rpcClient: RPCClient;
  private sessionId: string;
  private paillierPublicKey: any;
  private paillierSecretKey: any;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly navigationService: NavigationService,
    private readonly settings: SettingsService,
    private readonly rpc: RPCServerService,
    private readonly keyChainService: KeyChainService,
    private readonly syncService: SyncService
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

    const seedHash = await Utils.sha256(this.keyChainService.seed);

    this.sessionId = uuid(seedHash.toJSON().data, serviceId);

    const { publicKey, secretKey } = await DistributedEcdsaKey.generatePaillierKeys();

    this.paillierPublicKey = publicKey;
    this.paillierSecretKey = secretKey;

    console.log(this.sessionId);

    await this.rpc.start('0.0.0.0', 5666);

    console.log('Rpc started');
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.rpc.stop();
    console.log('Rpc stopped');
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

  public async connect() {
    console.log('connect()');
    this.socket = new PlainSocket();
    this.rpcClient = new RPCClient(new Client(this.socket));

    await this.socket.open('127.0.0.1', 5666);

    const capabilities = await this.rpcClient.api.capabilities({});

    console.log(capabilities);

    console.log('Connected');
  }

  public async sync() {
    console.log('sync()');

    await this.syncService.sync(
      this.sessionId,
      this.paillierPublicKey,
      this.paillierSecretKey,
      this.rpcClient
    );

    console.log('Synchronized');
  }

  public async syncBitcoinTest() {
    console.log('syncBitcoinTest()');

    this.syncService.forceCurrency(CurrencyId.BitcoinTest);

    console.log('Bumped');
  }

  public async signBitcoinTest() {
    console.log('signBitcoinTest()');
    const bitcoin = this.syncService.currency(CurrencyId.BitcoinTest) as EcdsaCurrency;

    console.log(await bitcoin.distributedKey.compoundPublic());

    const syncStateResponse = await this.rpcClient.api.syncState({ sessionId: this.sessionId, currencyId: bitcoin.id });

    console.log(syncStateResponse);

    if (syncStateResponse.state !== SyncState.Finalized) {
      throw new Error('Not synced');
    }

    const btcWallet = BitcoinWallet.fromOptions({
      network: BitcoinWallet.Testnet,
      point: await bitcoin.distributedKey.compoundPublic(),
      endpoint: 'https://test-insight.bitpay.com/api'
    });

    console.log(btcWallet.address);

    const tx = await btcWallet.prepareTransaction(await BitcoinTransaction.create(), btcWallet.address, btcWallet.toInternal(0.01));

    const distributedSignSession = await tx.startSignSession(bitcoin.distributedKey);

    const entropyCommitment = await distributedSignSession.createEntropyCommitment();

    const transactionBytes = Marshal.encode(tx);

    const txId = await Utils.randomBytes(32);

    const signSessionId = uuid(txId.toJSON().data, serviceId);

    const startSignResponse = await this.rpcClient.api.startEcdsaSign({
      sessionId: this.sessionId,
      currencyId: bitcoin.id,
      signSessionId,
      transactionBytes,
      entropyCommitmentBytes: Marshal.encode(entropyCommitment)
    });
    console.log(startSignResponse);

    const entropyData = Marshal.decode(startSignResponse.entropyDataBytes);

    const entropyDecommitment = await distributedSignSession.processEntropyData(entropyData);

    const signRevealResponse = await this.rpcClient.api.ecdsaSignReveal({
      sessionId: this.sessionId,
      currencyId: bitcoin.id,
      signSessionId,
      entropyDecommitmentBytes: Marshal.encode(entropyDecommitment)
    });
    console.log(signRevealResponse);

    const partialSignature = Marshal.decode(signRevealResponse.partialSignatureBytes);

    const signature = await distributedSignSession.finalizeSignature(partialSignature);

    await tx.applySignature(signature);

    console.log(await tx.verify());

    console.log('Signed');
  }

  public async disconnect() {
    console.log('disconnect()');
    const clearResponse = await this.rpcClient.api.clearSession({ sessionId: this.sessionId });

    console.log(clearResponse);

    await this.rpcClient.close();

    console.log('Disconnected');
  }
}
