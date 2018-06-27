import { Component, OnInit, ViewChild } from '@angular/core';
import { DeleteSecretComponent } from "../delete-secret/delete-secret.component";
import { SecretExportComponent } from "../secret-export/secret-export.component";
import { VerifyTransactionComponent } from "./verify-transaction/verify-transaction.component";
import { Router } from "@angular/router";
import { WalletService } from "../../services/wallet.service";
import { BluetoothService } from "../../services/bluetooth.service";
import { KeyChainService } from "../../services/keychain.service";
import { NavigationService } from "../../services/navigation.service";
import { NotificationService } from "../../services/notification.service";
import { FileService } from "../../services/file.service";
import { Subject } from "rxjs";
import { bufferWhen, map, timeInterval, filter, skipUntil} from 'rxjs/operators';
import { Status } from "../../services/wallet/currencywallet";
import { CurrencyService } from "../../services/currency.service";

declare const window: any;

@Component({
  selector: 'app-verifier',
  templateUrl: './verifier.component.html',
  styleUrls: ['./verifier.component.css']
})
export class VerifierComponent implements OnInit {
  public navLinks = [{
    name: 'Verification',
    clicked: async () => {
      await this.router.navigate(['/navigator', { outlets: { navigator: ['main'] } }])
    }
  }, {
    name: 'Export secret',
    clicked: async () => {
      await this.onExport();
    }
  }, {
    name: 'Change PIN'
  }, {
    name: 'Delete secret',
    clicked: () => {
      this.onDelete();
    }
  }, {
    name: 'Exit',
    clicked: async () => {
      await this.router.navigate(['/start'])
    }
  }];

  public coinStatusType = Status;

  public current = 'Verification';

  public synchedCoins = [];

  public currencyWallets = this.wallet.currencyWallets;

  public enabled = this.bt.enabled;
  public discoverable = this.bt.discoverable;
  public connected = this.bt.connected;

  public synchronizing = this.wallet.synchronizing;
  public partiallySync = this.wallet.partiallySync;
  public fullySync = this.wallet.fullySync;
  public progress = this.wallet.syncProgress;

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

  @ViewChild('sidenav') sidenav;

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly wallet: WalletService,
    private readonly bt: BluetoothService,
    private readonly keychain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly currencyService: CurrencyService,
    private readonly fs: FileService
  ) {
    this.subscriptions.push(
      this.bt.enabledEvent.subscribe(async () => {
        await this.bt.ensureListening();
      }));

    this.subscriptions.push(
      this.bt.connectedEvent.subscribe(async () => {
        await this.bt.stopListening();
        await this.wallet.sendSessionKey(true);
      }));

    this.subscriptions.push(
      this.bt.disabledEvent.subscribe(async () => {
        await this.wallet.cancelSync();
      }));

    this.subscriptions.push(
      this.bt.disconnectedEvent.subscribe(async () => {
        await this.wallet.cancelSync();
        await this.bt.ensureListening();
      }));

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

    if (!this.enabled.getValue()) {
      await this.bt.requestEnable();
    } else {
      await this.bt.ensureListening();
    }
  }

  public async ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    await this.keychain.reset();
    await this.wallet.reset();
    await this.wallet.resetSession();
    await this.bt.disconnect();
    await this.bt.stopListening();
  }

  async enableBluetooth() {
    await this.bt.requestEnable();
  }

  async enableDiscoverable() {
    await this.bt.enableDiscovery();
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
        await this.delete();
      }

      await this.fs.deleteFile(this.fs.safeFileName('seed'));

      await this.router.navigate(['/start']);
      this.notification.show('The secret successfully removed');
    });
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

  public async delete() {
    return new Promise((resolve, reject) => {
      window.plugins.touchid.delete('spatium', resolve, reject);
    });
  }
}
