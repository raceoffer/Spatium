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
import { BehaviorSubject } from 'rxjs';
import { FactorType } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

declare const nfc: any;
declare const ndef: any;
declare const navigator: any;
declare const Buffer: any;

@Component({
  selector: 'app-nfc-factor',
  templateUrl: './nfc-factor.component.html',
  styleUrls: ['./nfc-factor.component.css']
})
export class NfcFactorComponent implements AfterViewInit, OnInit, OnDestroy {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() isExport = false;
  @Input() secretValue = '';
  value: BehaviorSubject<string> = null;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  text = 'Touch an NFC tag';
  enableNFCmessage = 'Turn on NFC to proceed';
  isCreatedListener = false;
  disabledNFC = true;
  classNfcContainer = '';
  isActive = false;
  timer: any;

  constructor(private ngZone: NgZone,
              private readonly notification: NotificationService) { }

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
    this.isActive = false;
    nfc.removeNdefListener(
      (event) => this.ngZone.run(async () => await this.onNdef(event)),
      function () {
        console.log('Listening for NDEF tags rm.');
      },
      this.failure
    );

    nfc.removeTagDiscoveredListener(
      (event) => this.ngZone.run(async () => await this.onNfc(event)),
      function () {
        console.log('Listening for non-NDEF tags rm.');
      },
      this.failure
    );

    nfc.removeMimeTypeListener(
      'text/pg',
      (event) => this.ngZone.run(async () => await this.onNdef(event)),
      function () {
        console.log('Listening for NDEF mime tags with type text/pg rm.');
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
      await this.writeTag('Success write NFC tag', 'Error write NFC tag');
      navigator.vibrate(100);
    }

  }

  async onNdef(nfcEvent) {
    if (this.isActive) {
      await this.writeTag('Success write NFC tag', 'Error write NFC tag');
      navigator.vibrate(100);
    }
  }

  writeTag(success, error) {
    let payload = null;
    if (this.isExport) {
      payload = Array.from(this.secretValue);
    } else {
      payload = Array.from(this.value.getValue());
    }

    console.log(payload);

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
    this.onSuccess.emit({factor: FactorType.NFC, value: this.value.getValue()});
  }

}
