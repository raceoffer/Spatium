import { Component, EventEmitter, HostBinding, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from "rxjs/index";
import { checkAvailable, checkExisting, saveTouchPassword } from "../../../utils/fingerprint";
import { NavigationService } from "../../../services/navigation.service";
import { WorkerService } from "../../../services/worker.service";

import {
  deriveAesKey,
  encrypt,
  decrypt,
  randomBytes
} from 'crypto-core-async/lib/utils';
import { FileService } from "../../../services/file.service";
import { SecretImportComponent } from "../../secret-import/secret-import.component";
import { PincodeComponent } from '../../../inputs/pincode/pincode.component';
import { NotificationService } from "../../../services/notification.service";
import { getValue } from "../../../utils/storage";

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  @Output() created: EventEmitter<any> = new EventEmitter<any>();
  @Output() imported: EventEmitter<any> = new EventEmitter<any>();

  public busy = false;

  public touchAvailable = new BehaviorSubject<boolean>(false);
  public touchExisting = new BehaviorSubject<boolean>(false);
  public touchEnabled = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly navigationService: NavigationService,
    private readonly fs: FileService,
    private readonly workerService: WorkerService,
    private readonly notification: NotificationService
  ) { }

  async ngOnInit() {
    this.touchAvailable.next(await checkAvailable());
    this.touchExisting.next(await checkExisting());
    try {
      this.touchEnabled.next(await getValue('fingerprintEnabled'));
    } catch (ignored) {
      this.touchEnabled.next(true);
    }
  }

  public onImport() {
    const componentRef = this.navigationService.pushOverlay(SecretImportComponent);
    componentRef.instance.imported.subscribe(async seed => {
      this.navigationService.acceptOverlay();

      this.imported.next(seed);
    })
  }

  public async onSubmit(pincode) {
    try {
      this.busy = true;

      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);

      const seed = await randomBytes(64, this.workerService.worker);

      const encryptedSeed = (await encrypt(seed, aesKey, this.workerService.worker)).toString('hex');

      await this.fs.writeFile(this.fs.safeFileName('seed'), encryptedSeed);

      try {
        if (this.touchAvailable.getValue()) {
          await saveTouchPassword(pincode)
        }
      } catch (e) {
        if (e !== 'Cancelled') {
          throw e;
        }
      }

      this.created.next(seed);
    } catch (e) {
      if (e === 'KeyPermanentlyInvalidatedException') {
        this.notification.show('Some of the fingerprints were invalidated. Please confirm the pincode once again');
      } else {
        this.pincodeComponent.onClear();
        this.notification.show('Fingerprint authorization error');
      }
    } finally {
      this.busy = false;
    }
  }

  public async onBack() {
    await this.navigationService.back();
  }
}
