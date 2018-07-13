import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { bufferWhen, filter, map, skipUntil, timeInterval, distinctUntilChanged } from 'rxjs/operators';
import { ConnectionProviderService } from '../../services/connection-provider';
import { CurrencyService } from '../../services/currency.service';
import { DeviceService } from '../../services/device.service';
import { FileService } from '../../services/file.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WalletService } from '../../services/wallet.service';
import { Status } from '../../services/wallet/currencywallet';
import { deleteTouch } from '../../utils/fingerprint';
import { DeleteSecretComponent } from '../delete-secret/delete-secret.component';
import { FeedbackComponent } from '../feedback/feedback.component';
import { SecretExportComponent } from '../secret-export/secret-export.component';
import { ChangePincodeComponent } from './change-pincode/change-pincode.component';
import { SettingsComponent } from './settings/verifier-settings.component';
import { VerifyTransactionComponent } from './verify-transaction/verify-transaction.component';
import { toBehaviourSubject } from '../../utils/transformers';
import { State } from '../../services/primitives/state';

declare const window: any;

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

  public coinStatusType = Status;
  public current = 'Verification';
  public synchedCoins = [];
  public currencyWallets = this.wallet.currencyWallets;

  public ready = toBehaviourSubject(this.connectionProviderService.listeningState.pipe(
    map(state => state === State.Started),
    distinctUntilChanged()
  ), false);

  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;
  public fullySync = this.wallet.fullySync;
  public progress = this.wallet.syncProgress;

  public providers = this.connectionProviderService.providers;

  public providersArray = toBehaviourSubject(this.connectionProviderService.providers.pipe(
    map(providers => Array.from(providers.values()))
  ), []);

  @ViewChild('sidenav') sidenav;
  public isiOS = this.deviceService.isIOS;
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
  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly deviceService: DeviceService,
    private readonly wallet: WalletService,
    private readonly connectionProviderService: ConnectionProviderService,
    private readonly keychain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly currencyService: CurrencyService,
    private readonly fs: FileService
  ) {

    // this.providersArray.forEach((provider) => {
    //   this.subscriptions.push(
    //     provider.service.enabledEvent.subscribe(() => {
    //       if (provider.service.toggled.getValue()) {
    //         provider.service.startListening();
    //       }
    //     }));
    // });
    //
    // this.subscriptions.push(
    //   this.connectionProviderService.connectedEvent.subscribe(async () => {
    //     await this.connectionProviderService.stopListening(); // zeroconf not stopped
    //     await this.wallet.startHandshake();
    //     await this.wallet.startSync();
    //   }));
    //
    // this.subscriptions.push(
    //   this.connectionProviderService.disabledEvent.subscribe(async () => {
    //     await this.wallet.cancelSync();
    //   }));
    //
    // this.subscriptions.push(
    //   this.connectionProviderService.disconnectedEvent.subscribe(async () => {
    //     await this.wallet.cancelSync();
    //     await this.connectionProviderService.startListening();
    //   }));

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

    this.currencyWallets.forEach((currencyWallet, coin) => {
      this.subscriptions.push(
        currencyWallet.rejectedEvent.subscribe(() => {
        }));

      this.subscriptions.push(
        currencyWallet.startVerifyEvent.subscribe(() => {
        })
      );

      this.subscriptions.push(
        currencyWallet.verifyEvent.subscribe(transaction => {
          this.onTransaction(coin, transaction);
        })
      );
    });
  }

  public async ngOnInit() {
    for (const wallet of Array.from(this.wallet.coinWallets.values())) {
      this.subscriptions.push(
        wallet.status.subscribe(() => {
          const coins = [];

          for (const coin of Array.from(this.wallet.coinWallets.keys())) {
            const status = this.wallet.coinWallets.get(coin).status.getValue();

            if (status === Status.Synchronizing || status === Status.Ready) {
              const info = this.currencyService.getInfo(coin);
              coins.push({
                name: info.name,
                status: this.wallet.coinWallets.get(coin).status.getValue()
              });
            }
          }

          this.synchedCoins = coins;
        })
      );
    }
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.keychain.reset();
    await this.wallet.reset();
    this.connectionProviderService.reset();
  }

  async confirm(coin) {
    await this.currencyWallets.get(coin).acceptTransaction();
    await this.notification.cancelConfirmation();
  }

  async decline(coin) {
    await this.currencyWallets.get(coin).rejectTransaction();
    await this.notification.cancelConfirmation();
  }

  public toggleNavigation() {
    this.sidenav.toggle();
  }

  public openFeedback() {
    const componentRef = this.navigationService.pushOverlay(FeedbackComponent);
  }

  public onTransaction(coin, transaction) {
    const componentRef = this.navigationService.pushOverlay(VerifyTransactionComponent);
    componentRef.instance.currentCoin = coin;
    componentRef.instance.transaction = transaction;
    componentRef.instance.confirm.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.confirm(coin);
    });
    componentRef.instance.decline.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.decline(coin);
    });
    componentRef.instance.cancelled.subscribe(async () => {
      this.navigationService.acceptOverlay();
      await this.decline(coin);
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

      if (await this.checkAvailable() && await this.checkExisting()) {
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
    const componentRef = this.navigationService.pushOverlay(SettingsComponent);
  }


  public async checkAvailable() {
    return new Promise<boolean>((resolve, ignored) => {
      window.plugins.touchid.isAvailable(() => resolve(true), () => resolve(false));
    });
  }

  public async checkExisting() {
    return new Promise<boolean>((resolve, ignored) => {
      window.plugins.touchid.has('spatium', () => resolve(true), () => resolve(false));
    });
  }
}
