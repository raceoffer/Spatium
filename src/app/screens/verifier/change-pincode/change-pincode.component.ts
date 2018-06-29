import {Component, HostBinding, OnDestroy, ViewChild, OnInit, NgZone} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FileService } from '../../../services/file.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NotificationService } from '../../../services/notification.service';
import { NavigationService } from '../../../services/navigation.service';
import { WorkerService } from '../../../services/worker.service';
import { BehaviorSubject } from "rxjs/index";
import { map } from "rxjs/operators";
import { toBehaviourSubject } from "../../../utils/transformers";

import {
  deriveAesKey,
  encrypt,
  decrypt,
  randomBytes

} from 'crypto-core-async/lib/utils';
import { PincodeComponent } from "../../../inputs/pincode/pincode.component";

declare const Buffer: any;
declare const window: any;

@Component({
  selector: 'app-change-pincode',
  templateUrl: './change-pincode.component.html',
  styleUrls: ['./change-pincode.component.css']
})
export class ChangePincodeComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  confirmation: boolean = false;
  isCreate = true;
  pincode: string = '';
  busy = false;
  back: string = null;
  label: string = null;
  title = 'Change PIN';
  stUnlock = 'Enter your current PIN';
  stNew = 'Enter your new PIN';
  stConfirm = 'Re-Enter your new PIN';

  private subscriptions = [];

  public fileData = new BehaviorSubject<any>(null);
  public exists = toBehaviourSubject(this.fileData.pipe(map(data => data !== null)), false);

  constructor(
    private readonly fs: FileService,
    private readonly workerService: WorkerService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService
  ) {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBack();
      })
    );
    this.label = this.stUnlock;
  }

  async ngOnInit() {
    this.fileData.next(Buffer.from(await this.fs.readFile(this.fs.safeFileName('seed')), 'hex'));
  }

  ngOnDestroy() {
    this.pincode = '';
  }
  onBack() {
    this.navigationService.popOverlay();
  }

  async onSuccess(pincode) {
    try {
      this.busy = true;
      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);
      const seed = await decrypt(this.fileData.getValue(), aesKey, this.workerService.worker);
      this.keychain.setSeed(seed);
      this.label = this.stNew;
      this.confirmation = true;
    } catch (ignored) {
      this.notification.show('Incorrect PIN, please try again');
    } finally {
      this.busy = false;
      this.pincodeComponent.onClear();
    }
  }

  async onConfirm(pincode) {
    if (this.pincode === '') {//New pin
      this.pincode = pincode;
      this.label = this.stConfirm;
    } else {
      if (pincode === this.pincode) {//Confirm your pin
        console.log('Successful confirmation');
        this.onFingerClicked(pincode);
      } else {
        console.log('Unsuccessful confirmation');
        this.notification.show("Incorrect PIN confirmation, please try again");
      }
    }
    this.pincodeComponent.onClear();
  }

  async checkAvailable() {
    return new Promise<boolean>((resolve, ignored) => {
      window.plugins.touchid.isAvailable(() => resolve(true), () => resolve(false));
    });
  }

  async onFingerClicked(pincode) {
    try {
      this.busy = true;
      
      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);

      if (await this.checkAvailable()) {
        try {
          if (await this.saveTouchPassword(pincode)) {
            await this.savePin(aesKey);
          }
        } catch (e) {
          if (e === 'Cancelled') {
            await this.savePin(aesKey);
          } else if (e === 'KeyPermanentlyInvalidatedException') {
            this.notification.show('Some of the fingerprints were invalidated. Please confirm the pincode once again');
          } else {
            this.notification.show('Fingerprint authorization error');
          }
          console.log(e);
        }
      } else {
        await this.savePin(aesKey);
      }

      this.onBack();
    } catch (ignored) {
      console.log(ignored);
    } finally {
      this.busy = false;
      this.pincodeComponent.onClear();
    }
  }

  async saveTouchPassword(pincode) {
    return new Promise(async (success, error) => {
      window.plugins.touchid.save('spatium', pincode, true, success, error);
    });
  }

  async savePin(aesKey) {
    const encryptedSeed = (await encrypt(this.keychain.getSeed(), aesKey, this.workerService.worker)).toString('hex');

    await this.fs.writeFile(this.fs.safeFileName('seed'), encryptedSeed);

    this.onBack();
  }
}

