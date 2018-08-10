import { Component, EventEmitter, HostBinding, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { IdFactor } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';
import { StorageService } from '../../services/storage.service';

import { tryUnpackEncryptedSeed } from 'crypto-core-async/lib/utils';
import { checkNfc, Type } from '../../utils/nfc';

declare const cordova: any;

import {
  deriveAesKey,
  encrypt,
  decrypt,
  randomBytes
} from 'crypto-core-async/lib/utils';
import { PincodeComponent } from '../../inputs/pincode/pincode.component';
import { FileService } from '../../services/file.service';
import { checkAvailable, checkExisting, saveTouchPassword } from '../../utils/fingerprint';
import { BehaviorSubject } from 'rxjs';

enum State {
  Empty,
  Importing,
  Imported,
  Decrypting
}

@Component({
  selector: 'app-secret-import',
  templateUrl: './secret-import.component.html',
  styleUrls: ['./secret-import.component.css']
})
export class SecretImportComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  @Output() imported = new EventEmitter<any>();

  public contentType = IdFactor;
  public content = IdFactor.QR;

  public stateType = State;
  public buttonState = State.Empty;

  public nfcAvailable = true;
  public cameraAvailable = false;

  public secretType = null;
  public encryptedSeed = null;
  public seed = null;

  public busy = false;

  public touchAvailable = new BehaviorSubject<boolean>(false);
  public touchExisting = new BehaviorSubject<boolean>(false);
  public touchEnabled = new BehaviorSubject<boolean>(false);

  private subscriptions = [];
  private cameraChangesCallbackId: number;

  constructor(
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService,
    private readonly fs: FileService,
    private readonly ngZone: NgZone,
    private readonly workerService: WorkerService,
    private readonly storage: StorageService
  ) { }

  async ngOnInit() {
    this.nfcAvailable = await checkNfc();
    this.cameraAvailable = await cordova.plugins.cameraInfo.isAvailable();
    this.touchAvailable.next(await checkAvailable());
    this.touchExisting.next(await checkExisting());

    const stored = await this.storage.getValue('fingerprint.enabled');
    if (stored !== null) {
      this.touchEnabled.next(stored as boolean);
    } else {
      this.touchEnabled.next(true);
    }

    this.cameraChangesCallbackId = await cordova.plugins.cameraInfo.subscribeToAvailabilityChanges(
      cameraAvailable => this.ngZone.run(() => {
        this.cameraAvailable = cameraAvailable;
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    cordova.plugins.cameraInfo.unsubscribeFromAvailabilityChanges(this.cameraChangesCallbackId);
  }

  onBack() {
    this.navigationService.back();
  }

  toggleContent(content) {
    this.buttonState = State.Empty;
    this.content = content;
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

    this.secretType = type;
    this.encryptedSeed = secret;

    this.buttonState = State.Imported;
  }

  async onPincode(pincode) {
    try {
      this.busy = true;

      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);

      const seed = await decrypt(this.encryptedSeed, aesKey, this.workerService.worker);

      await this.fs.writeFile(this.fs.safeFileName('seed'), this.encryptedSeed.toString('hex'));

      try {
        if (this.touchAvailable.getValue()) {
          await saveTouchPassword(pincode);
        }
      } catch (e) {
        if (e !== 'Cancelled') {
          throw e;
        }
      }

      this.imported.next(seed);
    } catch (e) {
      if (e === 'KeyPermanentlyInvalidatedException') {
        this.notification.show('Some of the fingerprints were invalidated. Please confirm the pincode once again');
      } else {
        this.pincodeComponent.onClear();
        this.notification.show('Authorization error');
      }
    } finally {
      this.busy = false;
    }
  }

  onImport() {
    this.buttonState = State.Decrypting;
  }
}
