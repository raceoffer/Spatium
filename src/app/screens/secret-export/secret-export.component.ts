import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { IdFactor } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { WorkerService } from '../../services/worker.service';

declare const nfc: any;

import { checkNfc } from "../../utils/nfc";

import { packSeed } from 'crypto-core-async/lib/utils';

@Component({
  selector: 'app-secret-export',
  templateUrl: './secret-export.component.html',
  styleUrls: ['./secret-export.component.css']
})
export class SecretExportComponent implements OnInit {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  @Input() public encryptedSeed: any = null;
  @Output() public saved = new EventEmitter<any>();
  @Output() public continue = new EventEmitter<any>();

  public contentType = IdFactor;
  public content = IdFactor.QR;

  public nfcAvailable = true;

  public qrData: string = null;
  public nfcData: any = null;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) { }

  async ngOnInit() {
    this.nfcAvailable = await checkNfc();

    const packed = await packSeed(this.encryptedSeed, this.workerService.worker);

    this.qrData = packed.toString('hex');
    this.nfcData = packed;
  }

  onBack() {
    this.navigationService.back();
  }

  toggleContent(content) {
    this.content = content;
  }

  onSaved(ignored) {
    this.saved.next();
  }

  onContinue() {
    this.continue.next();
  }
}
