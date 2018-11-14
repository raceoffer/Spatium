import { Component, EventEmitter, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import BN from 'bn.js';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { bufferWhen, filter, map, mergeMap, skipUntil, switchMap, timeInterval } from 'rxjs/operators';
import { NavbarComponent } from '../../modals/navbar/navbar.component';
import { CurrencyId, CurrencyInfoService } from '../../services/currencyinfo.service';
import { DeviceService, Platform } from '../../services/device.service';
import { FileService } from '../../services/file.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { SsdpService } from '../../services/ssdp.service';
import { Currency, VerifierService } from '../../services/verifier.service';
import { CurrencyModel, SyncState } from '../../services/wallet/wallet';
import { checkAvailable, checkExisting, deleteTouch } from '../../utils/fingerprint';
import { toBehaviourSubject } from '../../utils/transformers';
import { DeleteSecretComponent } from '../delete-secret/delete-secret.component';
import { FeedbackComponent } from '../feedback/feedback.component';
import { SecretExportComponent } from '../secret-export/secret-export.component';
import { ChangePincodeComponent } from './change-pincode/change-pincode.component';
import { SettingsComponent } from './settings/verifier-settings.component';
import { VerifyTransactionComponent } from './verify-transaction/verify-transaction.component';
import { AnalyticsService, View } from '../../services/analytics.service';

@Component({
  selector: 'app-verifier',
  templateUrl: './verifier.component.html',
  styleUrls: ['./verifier.component.css']
})
export class VerifierComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  public navLinks = [{
    name: 'Export secret',
    clicked: async () => {
      await this.onExport();
    }
  }, {
    name: 'Change PIN',
    clicked: () => {
      this.onChangePIN();
    }
  }, {
    name: 'Settings',
    clicked: () => {
      this.onSettings();
    }
  }, {
    name: 'Delete secret',
    clicked: () => {
      this.onDelete();
    }
  }, {
    name: 'Feedback',
    clicked: () => {
      this.openFeedback();
    }
  }, {
    name: 'Exit',
    clicked: async () => {
      await this.router.navigate(['/start']);
    }
  }];

  public isIOS: boolean;
  public sessions: BehaviorSubject<Array<{
    sessionId: string,
    active: boolean,
    deviceInfo: {
      name: string
    },
    syncPercent: number,
    currencies: Array<{
      currencyId: CurrencyId,
      model: CurrencyModel,
      state: SyncState
    }>
  }>>;
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
  private signCancelled: EventEmitter<any> = new EventEmitter<any>();

  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly keychain: KeyChainService,
              private readonly navigationService: NavigationService,
              private readonly notification: NotificationService,
              private readonly rpcService: RPCServerService,
              private readonly verifierService: VerifierService,
              private readonly currencyInfoService: CurrencyInfoService,
              private readonly fs: FileService,
              private readonly ssdp: SsdpService,
              private readonly deviceService: DeviceService,
              private readonly analyticsService: AnalyticsService,) {
    this.sessions = toBehaviourSubject(this.verifierService.sessionEvent.pipe(
      map((sessionId) => this.verifierService.session(sessionId)),
      mergeMap((deviceSession) => deviceSession ? combineLatest<Currency | boolean>([
        deviceSession.currencyEvent,
        deviceSession.active
      ]).pipe(
        map(([currency]: [Currency]) => currency)
      ) : of(null)),
      switchMap((currency) => currency ? currency.state : of(null)),
      map(() => this.verifierService.sessions.map((session) => ({
        sessionId: session.id,
        active: session.active.getValue(),
        deviceInfo: session.deviceInfo,
        syncPercent: Math.round(
          100 * session.currencies.reduce((sum, c) => sum + c.state.getValue(), 0) / (4 * this.currencyInfoService.syncOrder.length)
        ),
        currencies: session.currencies.map((currency) => ({
          currencyId: currency.id,
          model: CurrencyModel.fromCoin(this.currencyInfoService.currencyInfo(currency.id)),
          state: currency.state.getValue()
        }))
      })))
    ), []);
  }

  async ngOnInit() {
    this.analyticsService.trackView(View.Verifier);

    this.isIOS = this.deviceService.platform === Platform.IOS;
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

    this.verifierService.setAcceptHandler(
      async (sessionId, model, address, value, fee, price) =>
        await this.accept(sessionId, model, address, value, fee, price)
    );

    this.verifierService.setCancelHandler(
      async (sessionId) => await new Promise<any>((resolve, ignored) => {
        this.signCancelled.next(sessionId);
        resolve();
      }));

    const rpcPort = 5666;
    await this.rpcService.start('0.0.0.0', rpcPort);
    await this.ssdp.startAdvertising(rpcPort);
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.keychain.reset();
    await this.rpcService.stop();
    await this.verifierService.reset();
    await this.ssdp.stop();
  }

  public async toggleNavigation() {
    const componentRef = this.navigationService.pushOverlay(NavbarComponent, Position.Left);

    if (!await checkAvailable()) {
      this.navLinks = this.navLinks.filter((link) => link.name !== 'Settings');
    }
    componentRef.instance.navLinks = this.navLinks;

    componentRef.instance.clicked.subscribe(async navLink => {
      this.navigationService.acceptOverlay();

      await navLink.clicked();
    });

    componentRef.instance.closed.subscribe(() => {
      this.navigationService.cancelOverlay();
    });
  }

  public openFeedback() {
    this.navigationService.pushOverlay(FeedbackComponent);
  }

  public async accept(sessionId: string,
                      model: CurrencyModel,
                      address: string,
                      value: BN,
                      fee: BN,
                      price: string): Promise<boolean> {
    return await new Promise<boolean>((resolve, ignored) => {
      const componentRef = this.navigationService.pushOverlay(VerifyTransactionComponent);
      componentRef.instance.sessionId = sessionId;
      componentRef.instance.model = model;
      componentRef.instance.address = address;
      componentRef.instance.valueInternal = value;
      componentRef.instance.feeInternal = fee;
      componentRef.instance.price = Number(price);

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

      this.subscriptions.push(
        this.signCancelled.subscribe(cancelledSessionId => {
          if (cancelledSessionId === sessionId) {
            this.navigationService.acceptOverlay();
            resolve(false);
          }
        }));
    });
  }

  public async onExport() {
    const encryptedSeed = Buffer.from(await this.fs.readFile(this.fs.safeFileName('seed')), 'hex');

    const componentRef = this.navigationService.pushOverlay(SecretExportComponent);
    componentRef.instance.encryptedSeed = encryptedSeed;
    componentRef.instance.saved.subscribe(() => {
      this.notification.show('The secret was exported');
    });
    componentRef.instance.continue.subscribe(() => {
      this.navigationService.acceptOverlay();
    });
  }

  public onDelete() {
    const componentRef = this.navigationService.pushOverlay(DeleteSecretComponent);
    componentRef.instance.submit.subscribe(async () => {
      this.navigationService.acceptOverlay();

      if (await checkAvailable() && await checkExisting()) {
        await deleteTouch();
      }

      await this.fs.deleteFile(this.fs.safeFileName('seed'));

      await this.router.navigate(['/start']);
      this.notification.show('The secret successfully removed');
    });
  }

  public onChangePIN() {
    const componentRef = this.navigationService.pushOverlay(ChangePincodeComponent);
    componentRef.instance.success.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.router.navigate(['/start']);
      this.notification.show('You have successfully changed a PIN-code');
    });
  }

  public onSettings() {
    this.navigationService.pushOverlay(SettingsComponent);
  }
}
