import {
  AfterViewInit, Component, EventEmitter, HostBinding, Input, NgZone, OnDestroy, OnInit,
  Output
} from '@angular/core';
import {FactorType} from '../../../services/auth.service';

declare const nfc: any;
declare const ndef: any;
declare const navigator: any;
declare const CryptoCore: any;
declare const Buffer: any;

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

  timer: any;

  constructor(private ngZone: NgZone) {
  }

  ngOnInit() {
    this.canScanAgain = false;
    this.classNfcContainer = '';
  }

  ngAfterViewInit() {
    this.nfc = '';

    this.checkState();

    document.addEventListener('resume', this.checkState.bind(this), false);

    if (!this.isCreatedListener) {
      nfc.addNdefListener(
        (event) => this.ngZone.run(async () => await this.onNdef(event)),
        function () {
          console.log('Listening for NDEF tags.');
        },
        this.failure
      );

      nfc.addTagDiscoveredListener(
        (event) => this.ngZone.run(async () => await this.onNfc(event)),
        function () {
          console.log('Listening for non-NDEF tags.');
        },
        this.failure
      );

      nfc.addMimeTypeListener(
        'text/pg',
        (event) => this.ngZone.run(async () => await this.onNdef(event)),
        function () {
          console.log('Listening for NDEF mime tags with type text/pg.');
        },
        this.failure
      );

      this.isCreatedListener = true;
    }

    this.timeout();
  }

  ngOnDestroy() {
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

  async onNdef(nfcEvent) {
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
          const value = await CryptoCore.Utils.tryUnpackEncryptedSeed(payload);
          this.nfc = value.toString('hex');
        } catch (exc) {
          console.log(exc);
          this.nfc = null;
        }
      } else {
        this.nfc = await CryptoCore.Utils.tryUnpackLogin(payload);
      }

      navigator.vibrate(100);

      await this.onNext();
    }
  }

  async onNext() {
    if (this.inputEvent) {
      this.canScanAgain = true;
      this.classNfcContainer = 'invisible';
      this.inputEvent.emit(this.nfc);
    }

    if (this.onSuccess) {
      this.onSuccess.emit({factor: FactorType.NFC, value: Buffer.from(this.nfc, 'utf-8')});
    }
  }

  scanAgain() {
    this.canScanAgain = false;
    this.classNfcContainer = '';
    this.clearEvent.emit();
  }

}
