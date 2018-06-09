import { Component, HostBinding, OnDestroy } from '@angular/core';
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
import { DeleteSecretComponent } from "../navigator-verifier/delete-secret/delete-secret.component";

@Component({
  selector: 'app-verifier-crate',
  templateUrl: './verifier-crate.component.html',
  styleUrls: ['./verifier-crate.component.css']
})
export class VerifierCrateComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

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

    this.fs.readFile(this.fs.safeFileName('seed'))
      .then(data => this.fileData.next(data))
      .catch(ignored => {});
    this.checkAvailable()
      .then(available => this.touchAvailable.next(available))
      .catch(ignored => {});
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

    await this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['main']}}]);
  }

  async saveTouchPassword(pincode) {
    return new Promise(async (success, error) => {
      window.plugins.touchid.save('spatium', pincode, true, success, error);
    });
  }

  async checkAvailable() {
    return new Promise<boolean>((resolve, reject) => {
      window.plugins.touchid.isAvailable(resolve, reject);
    });
  }

  async delete() {
    return new Promise((resolve, reject) => {
      window.plugins.touchid.delete('spatium', resolve, reject);
    });
  }

  public onImport() {
    const componentRef = this.navigationService.pushOverlay(SecretImportComponent);
    componentRef.instance.imported(async encryptedSecret => {
      this.navigationService.acceptOverlay();

      await this.fs.writeFile(this.fs.safeFileName('seed'), encryptedSecret);

      await this.router.navigate(['/verifier-unlock']);
      this.notification.show('Secret is imported successfully');
    })
  }

  public onDelete() {
    const componentRef = this.navigationService.pushOverlay(DeleteSecretComponent);
    componentRef.instance.submit(async () => {
      this.navigationService.acceptOverlay();

      if (this.touchAvailable.getValue()) {
        await this.delete();
      }

      await this.fs.deleteFile(this.fs.safeFileName('seed'));

      await this.router.navigate(['/start']);
      this.notification.show('The secret successfully removed');
    })
  }

  public async onSubmit(pincode) {
    try {
      this.busy = true;

      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);
      if (this.exists.getValue()) {
        const ciphertext = Buffer.from(this.fileData.getValue(), 'hex');

        this.keychain.setSeed(await decrypt(ciphertext, aesKey, this.workerService.worker));

        await this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['main']}}]);
      } else {
        if (this.touchAvailable.getValue()) {
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
    } finally {
      this.busy = false;
    }
  }
}
