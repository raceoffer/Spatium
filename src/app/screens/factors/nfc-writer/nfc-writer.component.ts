import {
  AfterViewInit, Component, EventEmitter, HostBinding, Input, NgZone, OnDestroy, OnInit,
  Output
} from '@angular/core';
import {AuthService, FactorType} from "../../../services/auth.service";
import {DDSService} from "../../../services/dds.service";
import {NotificationService} from "../../../services/notification.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

declare const nfc: any;
declare const ndef: any;
declare const navigator: any;
declare const CryptoCore: any;
declare const Buffer: any;

@Component({
  selector: 'app-nfc-writer',
  templateUrl: './nfc-writer.component.html',
  styleUrls: ['./nfc-writer.component.css']
})
export class NfcWriterComponent implements AfterViewInit, OnInit, OnDestroy {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() isExport = false;
  value: BehaviorSubject<string> = null;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();

  text = 'Touch an NFC tag';
  enableNFCmessage = 'Turn on NFC to proceed';
  isActive = false;
  isCreatedListener = false;
  disabledNFC = true;
  classNfcContainer = '';

  timer: any;

  constructor(private ngZone: NgZone,
              private readonly notification: NotificationService) {  }

  ngOnInit() {
    this.classNfcContainer = '';
  }

  ngAfterViewInit() {
    this.isActive = true;
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
    await this.writeTag('Success write NFC tag', 'Error write NFC tag');
    navigator.vibrate(100);
  }

  async onNdef(nfcEvent) {
    await this.writeTag('Success write NFC tag', 'Error write NFC tag');
    navigator.vibrate(100);
  }

  writeTag(success, error) {
    const payload = Array.from(this.value.getValue());
    const mimeType = 'text/pg';

    const record = ndef.mimeMediaRecord(mimeType, payload);

    nfc.write([record], () => this.ngZone.run(async () => {
      this.notification.show(success);
      await this.onNext();
    }), (e) => this.ngZone.run(() => {
      console.log('Error write ' + JSON.stringify(e));
      this.notification.show(error);
    }));
  }

  async onNext() {
    this.onSuccess.emit({factor: FactorType.NFC, value: Buffer.from(this.value.getValue(), 'utf-8')});
  }

}
