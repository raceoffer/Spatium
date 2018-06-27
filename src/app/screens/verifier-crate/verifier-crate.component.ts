import {Component, HostBinding, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { NavigationService } from "../../services/navigation.service";
import { Router } from "@angular/router";
import { KeyChainService } from "../../services/keychain.service";
import { WorkerService } from "../../services/worker.service";

declare const window: any;

import {
  deriveAesKey,
  encrypt,
  decrypt,
  randomBytes
} from 'crypto-core-async/lib/utils';
import { FileService } from "../../services/file.service";
import { NotificationService } from "../../services/notification.service";
import { SecretImportComponent } from "../secret-import/secret-import.component";
import { BehaviorSubject } from "rxjs/index";
import { toBehaviourSubject } from "../../utils/transformers";
import { map } from "rxjs/operators";
import { DeleteSecretComponent } from "../delete-secret/delete-secret.component";
import { PincodeComponent } from "../../inputs/pincode/pincode.component";

@Component({
  selector: 'app-verifier-crate',
  templateUrl: './verifier-crate.component.html',
  styleUrls: ['./verifier-crate.component.css']
})
export class VerifierCrateComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  private subscriptions = [];

  public busy = false;

  public touchAvailable = new BehaviorSubject<any>(false);

  public fileData = new BehaviorSubject<any>(null);
  public exists = toBehaviourSubject(this.fileData.pipe(map(data => data !== null)), false);

  constructor(
    private readonly navigationService: NavigationService,
    private readonly router: Router,
    private readonly keychain: KeyChainService,
    private readonly fs: FileService,
    private readonly workerService: WorkerService,
    private readonly notification: NotificationService
  ) {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBack();
      })
    );
  }

  async ngOnInit() {
    this.fileData.next(Buffer.from(await this.fs.readFile(this.fs.safeFileName('seed')), 'hex'));
    this.touchAvailable.next(await this.checkAvailable() && await this.checkExisting());
  }

  async checkAvailable() {
    return new Promise<boolean>((resolve, ignored) => {
      window.plugins.touchid.isAvailable(() => resolve(true), () => resolve(false));
    });
  }

  async checkExisting() {
    return new Promise<boolean>((resolve, ignored) => {
      window.plugins.touchid.has('spatium', () => resolve(true), () => resolve(false));
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  public async onBack() {
    await this.router.navigate(['/start']);
  }

  async saveSeed(aesKey) {
    const seed = await randomBytes(64, this.workerService.worker);

    const encryptedSeed = (await encrypt(seed, aesKey, this.workerService.worker)).toString('hex');

    await this.fs.writeFile(this.fs.safeFileName('seed'), encryptedSeed);

    this.keychain.setSeed(seed);

    await this.router.navigate(['/verifier']);
  }

  async saveTouchPassword(pincode) {
    return new Promise(async (success, error) => {
      window.plugins.touchid.save('spatium', pincode, true, success, error);
    });
  }

  async getTouchPassword() {
    return new Promise<string>((resolve) => {
      window.plugins.touchid.verify('spatium', '',(pincode) => resolve(pincode));
    });
  }

  async delete() {
    return new Promise((resolve, reject) => {
      window.plugins.touchid.delete('spatium', resolve, reject);
    });
  }

  public onImport() {
    const componentRef = this.navigationService.pushOverlay(SecretImportComponent);
    componentRef.instance.imported.subscribe(async encryptedSecret => {
      this.navigationService.acceptOverlay();

      this.fileData.next(encryptedSecret);

      // ^This is optional^
      await this.fs.writeFile(this.fs.safeFileName('seed'), encryptedSecret.toString('hex'));

      this.notification.show('Secret is imported successfully');
    })
  }

  public onDelete() {
    const componentRef = this.navigationService.pushOverlay(DeleteSecretComponent);
    componentRef.instance.submit.subscribe(async () => {
      this.navigationService.acceptOverlay();

      if (this.touchAvailable) {
        await this.delete();
      }

      await this.fs.deleteFile(this.fs.safeFileName('seed'));

      await this.router.navigate(['/start']);
      this.notification.show('The secret successfully removed');
    })
  }

  public async onFinger() {
    const pincode = await this.getTouchPassword();
    await this.submit(pincode);
  }

  public async onSubmit(pincode) {
    await this.submit(pincode);
  }

  public async submit(pincode) {
    try {
      this.busy = true;

      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);
      if (this.exists.getValue()) {
        const seed = await decrypt(this.fileData.getValue(), aesKey, this.workerService.worker);

        this.keychain.setSeed(seed);

        await this.router.navigate(['/verifier']);
      } else {
        if (this.touchAvailable) {
          try {
            if (await this.saveTouchPassword(pincode)) {
              await this.saveSeed(aesKey);
            }
          } catch (e) {
            if (e === 'Cancelled') {
              await this.saveSeed(aesKey);
            } else if (e === 'KeyPermanentlyInvalidatedException') {
              this.notification.show('Some of the fingerprints were invalidated. Please confirm the pincode once again');
            } else {
              this.notification.show('Fingerprint authorization error');
            }
          }
        } else {
          await this.saveSeed(aesKey);
        }
      }
    } catch (e) {
      this.pincodeComponent.onClear();
      this.notification.show('Authorization error');
    } finally {
      this.busy = false;
    }
  }
}
