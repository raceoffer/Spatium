import { Component, EventEmitter, HostBinding, ViewChild, NgZone, OnInit, Output } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { IdFactor } from "../../services/auth.service";
import { NotificationService } from "../../services/notification.service";
import { WorkerService } from "../../services/worker.service";
import { KeyChainService } from '../../services/keychain.service';
import { PincodeComponent } from "../../inputs/pincode/pincode.component";

import { tryUnpackEncryptedSeed } from 'crypto-core-async/lib/utils';
import { checkNfc, Type } from "../../utils/nfc";

import {
  deriveAesKey,
  encrypt,
  decrypt,
  randomBytes,
  useWorker
} from 'crypto-core-async/lib/utils';

declare const window: any;

enum State {
  Empty,
  Importing,
  Imported
}

@Component({
  selector: 'app-secret-import',
  templateUrl: './secret-import.component.html',
  styleUrls: ['./secret-import.component.css']
})
export class SecretImportComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  @Output() imported = new EventEmitter<any>();
  public busy = false;
  public title = 'Import secret';

  public contentType = IdFactor;
  public content = IdFactor.QR;

  public stateType = State;
  public buttonState = State.Empty;

  public nfcAvailable = true;

  public secretType = null;
  public secret = null;

  constructor(
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly keychain: KeyChainService,
    private readonly ngZone: NgZone,
    private readonly workerService: WorkerService
  ) { }

  async ngOnInit() {
    this.nfcAvailable = await checkNfc();
  }

  onBack() {
    this.navigationService.back();
  }

  toggleContent(content) {
    this.ngZone.run(async () => {
      this.content = content;
      this.buttonState = State.Empty;
    });
  }

  async onInput(type: IdFactor, input: any) {
    this.buttonState = State.Importing;

    let secret = null;
    switch (type) {
      case IdFactor.QR:
        let bytes = null;
        try {
          bytes = Buffer.from(input, 'hex');
        } catch (e) {}
        if (input && bytes) {
          secret = await tryUnpackEncryptedSeed(bytes, this.workerService.worker);
        }
        break;
      case IdFactor.NFC:
        if (input && input.type === Type.MIME) {
          secret = await tryUnpackEncryptedSeed(input.payload, this.workerService.worker);
        }
        break;
    }

    if (!secret) {
      this.buttonState = State.Empty;
      this.notification.show('Failed to import a Spatium secret');
      return;
    }

    this.toggleContent(IdFactor.Pincode);
    this.title = 'Enter PIN of imported secret';

    this.secretType = type;
    this.secret = secret;

    this.buttonState = State.Imported
  }

  onSuccess() {
    this.toggleContent(this.secretType);
    this.buttonState = State.Imported;
    this.title = 'Import secret';
  }

  onImport() {
    this.imported.next(this.secret);
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

  async saveTouchPassword(pincode) {
    return new Promise(async (success, error) => {
      window.plugins.touchid.save('spatium', pincode, true, success, error);
    });
  }

  public async onSubmit(pincode) {
    try {
      console.log(pincode);
      this.busy = true;

      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);

      const ciphertext = Buffer.from(this.secret, 'hex');

      const seed = await decrypt(ciphertext, aesKey, this.workerService.worker);

      this.keychain.setSeed(seed);
      if (this.checkAvailable()) {
        try {
          if (await this.saveTouchPassword(pincode)) {
            this.onSuccess();
          }
        } catch (e) {
          if (e === 'Cancelled') {
            await window.plugins.touchid.delete('spatium', async () => {
              console.log("TouchID was deleted");
            });
            this.onSuccess();
          } else if (e === 'KeyPermanentlyInvalidatedException') {
            this.notification.show('Some of the fingerprints were invalidated. Please confirm the pincode once again');
          } else {
            this.notification.show('Fingerprint authorization error');
          }
          console.log(e);
        }
      } else {
        this.onSuccess();
      }
    } catch (e) {
      console.log(e);
      this.pincodeComponent.onClear();
      this.notification.show('Authorization error');
    } finally {
      this.busy = false;
    }
  }
}
