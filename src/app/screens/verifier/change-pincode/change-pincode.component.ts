import { Component, HostBinding, ViewChild, OnInit, Output, EventEmitter } from '@angular/core';
import { FileService } from '../../../services/file.service';
import { NotificationService } from '../../../services/notification.service';
import { NavigationService } from '../../../services/navigation.service';
import { WorkerService } from '../../../services/worker.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBehaviourSubject } from '../../../utils/transformers';
import { AnalyticsService, View } from '../../../services/analytics.service';

import {
  deriveAesKey,
  encrypt,
  decrypt
} from 'crypto-core-async/lib/utils';
import { PincodeComponent } from '../../../inputs/pincode/pincode.component';
import {
  checkAvailable,
  checkExisting,
  deleteTouch,
  getTouchPassword,
  saveTouchPassword
} from '../../../utils/fingerprint';
import { SettingsService } from '../../../services/settings.service';

declare const Buffer: any;

export enum State {
  Decryption,
  NewPin,
  Confirmation
}

@Component({
  selector: 'app-change-pincode',
  templateUrl: './change-pincode.component.html',
  styleUrls: ['./change-pincode.component.css']
})
export class ChangePincodeComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  @Output() public success = new EventEmitter<any>();

  public stateType = State;
  public fileData = new BehaviorSubject<any>(null);
  public seed = new BehaviorSubject<any>(null);
  public newPincode = new BehaviorSubject<string>(null);

  public state = toBehaviourSubject(combineLatest(
    this.seed,
    this.newPincode
  ).pipe(map(([seed, newPincode]) => {
    if (seed && newPincode) {
      return State.Confirmation;
    } else if (seed) {
      return State.NewPin;
    } else {
      return State.Decryption;
    }
  })), State.Decryption);

  public stateLabel = toBehaviourSubject(this.state.pipe(
    map(state => {
    switch (state) {
      case State.Decryption:
        return 'Enter your current PIN';
      case State.NewPin:
        return 'Enter your new PIN';
      case State.Confirmation:
        return 'Re-Enter your new PIN';
    }
  })), '');

  public busy = false;

  public touchAvailable = new BehaviorSubject<boolean>(false);
  public touchExisting = new BehaviorSubject<boolean>(false);
  public touchEnabled = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly fs: FileService,
    private readonly workerService: WorkerService,
    private readonly navigationService: NavigationService,
    private readonly notification: NotificationService,
    private readonly settings: SettingsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async ngOnInit() {
    this.analyticsService.trackView(View.ChangePincode);

    this.fileData.next(Buffer.from(await this.fs.readFile(this.fs.safeFileName('seed')), 'hex'));
    this.touchAvailable.next(await checkAvailable());
    this.touchExisting.next(await checkExisting());
    const stored = await this.settings.fingerprintEnabled();
    if (stored !== null) {
      this.touchEnabled.next(stored as boolean);
    } else {
      this.touchEnabled.next(true);
    }
  }

  onBack() {
    this.navigationService.popOverlay();
  }

  async onInput(pincode) {
    switch (this.state.getValue()) {
      case State.Decryption:
        return await this.onPincode(pincode);
      case State.NewPin:
        return await this.onNewPincode(pincode);
      case State.Confirmation:
        return await this.onConfirmation(pincode);
    }
  }

  async onFinger() {
    const pincode = await getTouchPassword();
    await this.onPincode(pincode);
  }

  async onPincode(pincode) {
    try {
      this.busy = true;
      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);
      const seed = await decrypt(this.fileData.getValue(), aesKey, this.workerService.worker);

      this.seed.next(seed);
    } catch (ignored) {
      this.notification.show('Incorrect PIN, please try again');
    } finally {
      this.busy = false;
      this.pincodeComponent.onClear();
    }
  }

  async onNewPincode(pincode) {
    this.newPincode.next(pincode);
    this.pincodeComponent.onClear();
  }

  async onConfirmation(pincode) {
   if (pincode === this.newPincode.getValue()) {
     try {
       this.busy = true;

       const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);

       const seed = this.seed.getValue();

       const encryptedSeed = (await encrypt(seed, aesKey, this.workerService.worker)).toString('hex');

       await this.fs.writeFile(this.fs.safeFileName('seed'), encryptedSeed);

       try {
         if (this.touchAvailable.getValue()) {
           if (this.touchExisting.getValue()) {
             await deleteTouch();
           }
           await saveTouchPassword(pincode);
         }
       } catch (e) {
         if (e !== 'Cancelled') {
           throw e;
         }
       }

       this.success.emit();
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
    } else {
     this.notification.show('Incorrect confirmation, please try again');
    }
    this.pincodeComponent.onClear();
  }
}
