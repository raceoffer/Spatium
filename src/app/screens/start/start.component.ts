import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DeviceService, Platform } from '../../services/device.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { StorageService } from '../../services/storage.service';
import { PresentationComponent } from '../presentation/presentation.component';
import { KeyChainService } from '../../services/keychain.service';

import { PlainServerSocket } from '../../utils/sockets/plainserversocket';
import { PlainSocket } from '../../utils/sockets/plainsocket';
import { Client, Server } from '../../utils/client-server/client-server';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { RPCClient } from '../../services/rpc/rpc-client';

import {
  PedersenParameters,
  PedersenCommitment,
  SchnorrProof,
  Convert,
  CompoundKeyEcdsa,
  KeyChain,
  PaillierProover
} from 'crypto-core-async';

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

  private serverSocket = null;
  private serverClientSocket = null;
  private clientSocket = null;

  private server: Server = null;
  private client: Client = null;

  private rpcClient: RPCClient = null;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly keyChainService: KeyChainService,
    private readonly router: Router,
    private readonly navigationService: NavigationService,
    private readonly storage: StorageService,
    private readonly rpc: RPCServerService
  ) {}

  public async ngOnInit() {
    await this.deviceService.deviceReady();

    this.serverSocket = new PlainServerSocket();
    this.clientSocket = new PlainSocket();

    this.client = new Client(this.clientSocket);

    this.rpcClient = new RPCClient(this.client);

    this.clientSocket.state.subscribe(state => console.log('Client State ', state));
    this.clientSocket.data.subscribe((data) => {
      console.log('Client data', data);
    });

    this.serverSocket.opened.subscribe(async (socket) => {
      this.serverClientSocket = socket;
      this.server = new Server(this.serverClientSocket);
      this.serverClientSocket.state.subscribe(state => console.log('Server State ', state));
      this.serverClientSocket.data.subscribe((data) => {
        console.log('Server data', data);
      });

      this.server.setRequestHandler(async (data) => {
        return await this.rpc.handleRequest(data);
      });
    });

    const viewed = await this.storage.getValue('presentation.viewed') as boolean;
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

    const startPath = await this.storage.getValue('startPath');
    if (startPath !== null) {
      await this.router.navigate([startPath as string]);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public openPresentation() {
    const componentRef = this.navigationService.pushOverlay(PresentationComponent, Position.Fullscreen);
    componentRef.instance.finished.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.storage.setValue('presentation.viewed', true);
    });
    componentRef.instance.skipped.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.storage.setValue('presentation.viewed', true);
    });
  }

  public async onOpenClicked() {
    try {
      await this.storage.setValue('startPath', '/login');
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/login']);
  }

  public async onConnectClicked() {
    try {
      await this.storage.setValue('startPath', '/verifier-auth');
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/verifier-auth']);
  }

  public async test1() {
    await this.serverSocket.start('0.0.0.0', 5666);
    await this.clientSocket.open('127.0.0.1', 5666);
  }

  public async test2() {
    const capabilities = await this.rpcClient.api.capabilities({});

    console.log(capabilities);

    const registerResponse = await this.rpcClient.api.registerSession({ sessionId: Buffer.from('ffffaadd', 'hex') });

    console.log(registerResponse);

    const syncStatusResponse = await this.rpcClient.api.syncStatus({ sessionId: Buffer.from('ffffaadd', 'hex') });

    console.log(syncStatusResponse);

    const seed = Buffer.from('9ff992e811d4b2d2407ad33b263f567698c37bd6631bc0db90223ef10bce7dca28b8c670522667451430a1cb10d1d6b114234d1c2220b2f4229b00cadfc91c4d', 'hex');

    const keyChain = KeyChain.fromSeed(seed);

    const initiatorPrivateBytes = keyChain.getAccountSecret(60, 0);

    const paillierKeys = await CompoundKeyEcdsa.generatePaillierKeys();

    const initiator = await CompoundKeyEcdsa.fromOptions({
      curve: 'secp256k1',
      secret: initiatorPrivateBytes,
      paillierKeys
    });

    const proover = await initiator.startSyncSession();

    const initialCommitment = await proover.createInitialCommitment();

    const startSyncResponse = await this.rpcClient.api.startSync({
      sessionId: Buffer.from('ffffaadd', 'hex'),
      currencyId: 'asdakljsdlkasj',
      params: initialCommitment.params.toJSON(),
      i: initialCommitment.i.toJSON()
    });

    console.log({
      Q: Convert.decodePoint(initiator.crypto, startSyncResponse.Q),
      proof: SchnorrProof.fromJSON(startSyncResponse.proof)
    });

    const clearResponse = await this.rpcClient.api.clearSession({ sessionId: Buffer.from('ffffaadd', 'hex') });

    console.log(clearResponse);
  }
}
