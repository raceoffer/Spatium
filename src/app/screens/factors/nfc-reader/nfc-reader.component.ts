import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FactorType } from '../../../services/auth.service';
import { WorkerService } from '../../../services/worker.service';

declare const nfc: any;
declare const ndef: any;
declare const navigator: any;
declare const Buffer: any;

import {
  tryUnpackLogin,
  tryUnpackEncryptedSeed,
  useWorker
} from 'crypto-core-async/lib/utils';

@Component({
  selector: 'app-nfc-reader',
  templateUrl: './nfc-reader.component.html',
  styleUrls: ['./nfc-reader.component.css']
})
export class NfcReaderComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() isImport = false;
  @Input() isRepeatable = false;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();

  nfc = '';
  text = 'Touch an NFC tag';
  enableNFCmessage = 'Turn on NFC to proceed';
  isCreatedListener = false;

  disabledNFC = true;
  canScanAgain = false;
  classNfcContainer = '';
  isActive = false;
  timer: any;

  constructor(
    private readonly ngZone: NgZone,
    private readonly workerService: WorkerService
  ) {
    useWorker(workerService.worker);
  }

  ngOnInit() {
    this.canScanAgain = false;
    this.classNfcContainer = '';
  }

  ngAfterViewInit() {
    this.isActive = true;
    this.nfc = '';
    this.checkState();

    document.addEventListener('resume', this.checkState.bind(this), false);

    if (!this.isCreatedListener) {
      nfc.addNdefListener(
        (event) => this.ngZone.run(async () => await this.onNdef(event)),
        function () {
          console.log('Listening for NDEF tags reader.');
        },
        this.failure
      );

      nfc.addTagDiscoveredListener(
        (event) => this.ngZone.run(async () => await this.onNfc(event)),
        function () {
          console.log('Listening for non-NDEF tags reader.');
        },
        this.failure
      );

      nfc.addMimeTypeListener(
        'text/pg',
        (event) => this.ngZone.run(async () => await this.onNdef(event)),
        function () {
          console.log('Listening for NDEF mime tags with type text/pg reader.');
        },
        this.failure
      );

      this.isCreatedListener = true;
    }

    this.timeout();
  }

  ngOnDestroy() {
    this.isActive = false;

    nfc.removeNdefListener(
      (event) => this.ngZone.run(async () => await this.onNdef(event)),
      function () {
        console.log('Listening for NDEF tags reader rm.');
      },
      this.failure
    );

    nfc.removeTagDiscoveredListener(
      (event) => this.ngZone.run(async () => await this.onNfc(event)),
      function () {
        console.log('Listening for non-NDEF tags reader rm.');
      },
      this.failure
    );

    nfc.removeMimeTypeListener(
      'text/pg',
      (event) => this.ngZone.run(async () => await this.onNdef(event)),
      function () {
        console.log('Listening for NDEF mime tags with type text/pg reader rm.');
      },
      this.failure
    );

    clearTimeout(this.timer);
  }

  timeout() {
    this.timer = setTimeout(() => {
      this.checkState();
      this.timeout();
    }, 100);
  }

  checkState() {
    nfc.enabled(
      () => this.ngZone.run(() => {
        this.disabledNFC = false;
      }),
      () => this.ngZone.run(() => {
        this.disabledNFC = true;
      }));
  }

  changeNFCState() {
    nfc.showSettings();
  }

  failure(reason) {
    console.log('There was a problem ' + reason);
  }

  async onNfc(nfcEvent) {
    if (this.isActive) {
      if (this.isImport) {
        this.nfc = null;
        navigator.vibrate(100);
        await this.onNext();
      } else {
        console.log('onNfc');
        console.log(JSON.stringify(nfcEvent));

        this.nfc = nfcEvent.tag.id;

        navigator.vibrate(100);

        await this.onNext();
      }
    }
  }

  async onNdef(nfcEvent) {
    if (this.isActive) {
      console.log('onNdef');
      console.log(JSON.stringify(nfcEvent));

      const tag = nfcEvent.tag;

      // BB7 has different names, copy to Android names
      if (tag.serialNumber) {
        tag.id = tag.serialNumber;
        tag.isWritable = !tag.isLocked;
        tag.canMakeReadOnly = tag.isLockable;
      }

      if (!this.isRepeatable) {
        this.nfc = tag.id;

        navigator.vibrate(100);

        await this.onNext();
      } else {
        const payload = Buffer.from(tag.ndefMessage[0].payload);
        console.log(payload);

        if (this.isImport) {
          try {
            const value = await tryUnpackEncryptedSeed(payload);
            this.nfc = value.toString('hex');
          } catch (exc) {
            console.log(exc);
            this.nfc = null;
          }
        } else {
          this.nfc = await tryUnpackLogin(payload);
        }

        navigator.vibrate(100);

        await this.onNext();
      }
    }
  }

  async onNext() {
    if (this.inputEvent) {
      this.canScanAgain = true;
      this.classNfcContainer = 'invisible';
      this.inputEvent.emit(this.nfc);
    }

    if (this.onSuccess) {
      this.onSuccess.emit({factor: FactorType.NFC, value: this.nfc});
    }
  }

  scanAgain() {
    this.canScanAgain = false;
    this.classNfcContainer = '';
    this.clearEvent.emit();
  }

}
