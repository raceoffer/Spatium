import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { IdFactor } from "../../services/auth.service";
import { Type } from "../../inputs/nfc-reader/nfc-reader.component";
import { NotificationService } from "../../services/notification.service";
import { WorkerService } from "../../services/worker.service";

declare const nfc: any;

import { tryUnpackEncryptedSeed } from 'crypto-core-async/lib/utils';

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

  @Output() imported = new EventEmitter<any>();

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
    private readonly workerService: WorkerService
  ) { }

  async ngOnInit() {
    this.nfcAvailable = await this.checkNfc();
  }

  public async checkNfc() {
    return await new Promise<boolean>((resolve, reject) => nfc.enabled(
      () => resolve(true),
      e => {
        if (e === 'NO_NFC' || e === 'NO_NFC_OR_NFC_DISABLED') {
          resolve(false);
        } else {
          resolve(true);
        }
      }));
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
    this.secret = secret;

    this.buttonState = State.Imported
  }

  onImport() {
    this.imported.next(this.secret);
  }
}
