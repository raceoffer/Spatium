import { Component, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from "rxjs/index";
import { NavigationService } from "../../../services/navigation.service";
import { WorkerService } from "../../../services/worker.service";

import {
  deriveAesKey,
  encrypt,
  decrypt,
  randomBytes
} from 'crypto-core-async/lib/utils';
import { FileService } from "../../../services/file.service";
import { PincodeComponent } from '../../../inputs/pincode/pincode.component';
import { NotificationService } from "../../../services/notification.service";
import { checkAvailable, checkExisting, deleteTouch, getTouchPassword } from "../../../utils/fingerprint";
import { DeleteSecretComponent } from '../../delete-secret/delete-secret.component';
import { getValue } from "../../../utils/storage";

@Component({
  selector: 'app-decrypt',
  templateUrl: './decrypt.component.html',
  styleUrls: ['./decrypt.component.css']
})
export class DecryptComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @ViewChild(PincodeComponent) public pincodeComponent: PincodeComponent;

  @Input() fileData = null;

  @Output() decrypted: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleted: EventEmitter<any> = new EventEmitter<any>();

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

  public onDelete() {
    const componentRef = this.navigationService.pushOverlay(DeleteSecretComponent);
    componentRef.instance.submit.subscribe(async () => {
      this.navigationService.acceptOverlay();

      if (this.touchExisting.getValue()) {
        await deleteTouch();
      }

      await this.fs.deleteFile(this.fs.safeFileName('seed'));

      this.deleted.next();

      this.notification.show('The secret successfully removed');
    })
  }

  public async onFinger() {
    const pincode = await getTouchPassword();
    await this.submit(pincode);
  }

  public async onSubmit(pincode) {
    await this.submit(pincode);
  }

  public async submit(pincode) {
    try {
      this.busy = true;

      const aesKey = await deriveAesKey(Buffer.from(pincode, 'utf-8'), this.workerService.worker);

      const seed = await decrypt(this.fileData, aesKey, this.workerService.worker);

      this.decrypted.next(seed);
    } catch (e) {
      this.pincodeComponent.onClear();
      this.notification.show('Authorization error');
    } finally {
      this.busy = false;
    }
  }

  public async onBack() {
    await this.navigationService.back();
  }
}
