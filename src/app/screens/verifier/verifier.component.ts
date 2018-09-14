import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import BN from 'bn.js';
import { BehaviorSubject, Subject } from 'rxjs';
import { bufferWhen, filter, map, mergeMap, skipUntil, timeInterval } from 'rxjs/operators';
import { NavbarComponent } from '../../modals/navbar/navbar.component';
import { CurrencyId, CurrencyInfoService } from '../../services/currencyinfo.service';
import { FileService } from '../../services/file.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { RPCServerService } from '../../services/rpc/rpc-server.service';
import { SsdpService } from '../../services/ssdp.service';
import { VerifierService } from '../../services/verifier.service';
import { CurrencyModel, SyncState } from '../../services/wallet/wallet';
import { checkAvailable, checkExisting, deleteTouch } from '../../utils/fingerprint';
import { toBehaviourSubject } from '../../utils/transformers';
import { DeleteSecretComponent } from '../delete-secret/delete-secret.component';
import { FeedbackComponent } from '../feedback/feedback.component';
import { SecretExportComponent } from '../secret-export/secret-export.component';
import { ChangePincodeComponent } from './change-pincode/change-pincode.component';
import { SettingsComponent } from './settings/verifier-settings.component';
import { VerifyTransactionComponent } from './verify-transaction/verify-transaction.component';

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

  public sessions: BehaviorSubject<Array<{
    sessionId: string,
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

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly keychain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly rpcService: RPCServerService,
    private readonly verifierService: VerifierService,
    private readonly currencyInfoService: CurrencyInfoService,
    private readonly fs: FileService,
    private readonly ssdp: SsdpService
  ) {
    this.sessions = toBehaviourSubject(this.verifierService.sessionEvent.pipe(
      mergeMap((deviceSession) => deviceSession.currencyEvent.pipe(
        map((currency) => ({
          sessionId: deviceSession.id,
          deviceInfo: deviceSession.deviceInfo,
          currency: currency
        }))
      )),
      mergeMap(({ sessionId, deviceInfo, currency }) => currency.state.pipe(
        map((state) => ({
          sessionId,
          deviceInfo,
          currencyId: currency.id,
          model: CurrencyModel.fromCoin(this.currencyInfoService.currencyInfo(currency.id)),
          state
        }))
      )),
      map(({ sessionId, deviceInfo, currencyId, model, state }) => {
        const sessions = this.sessions.getValue();

        let session = sessions.find((s) => s.sessionId === sessionId);
        if (!session) {
          session = { sessionId, deviceInfo, syncPercent: 0, currencies: [] };
          sessions.push(session);
        }

        let currency = session.currencies.find((c) => c.currencyId === currencyId);
        if (!currency) {
          currency = { currencyId, model, state: SyncState.None };
          session.currencies.push(currency);
        }

        currency.state = state;

        session.syncPercent = Math.round(100 * session.currencies.reduce((sum, c) => sum + c.state, 0) / 40);

        return sessions;
      })
    ), []);
  }

  async ngOnInit() {
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
      async (sessionId, model, address, value, fee) => await this.accept(sessionId, model, address, value, fee)
    );

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

  public toggleNavigation() {
    const componentRef = this.navigationService.pushOverlay(NavbarComponent, Position.Left);
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
