import { AfterViewInit, Component, EventEmitter, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';

declare const nfc: any;
declare const ndef: any;
declare const navigator: any;
declare const Utils: any;

@Component({
  selector: 'app-nfc',
  host: {'class': 'child box content text-center'},
  templateUrl: './nfc.component.html',
  styleUrls: ['./nfc.component.css']
})
export class NfcComponent implements AfterViewInit, OnInit, OnDestroy {
  _nfc = '';
  entry = 'Sign in';
  buttonState = 0; // sign in = 0, sign up = 1
  next: string = null;
  back: string = null;
  isAuth = false;
  text = 'Touch an NFC tag';
  enableNFCmessage = 'Turn on NFC to proceed';
  isActive = false;
  isCreatedListener = false;
  isCheckingInProcess = true;

  disabledNFC = true;
  isDisable = false;
  isRepeatable = false;
  canScanAgain = false;
  classNfcContainer = '';

  timer: any;

  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() buisyEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private readonly dds: DDSService,
    private readonly notification: NotificationService
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
      if (params['isAuth']) {
        this.isAuth = (params['isAuth'] === 'true');
      }
    });
  }

  ngOnInit() {
    if (this.next == null && this.back == null) {
      this.isRepeatable = true;
    }

    this.canScanAgain = false;
    this.classNfcContainer = '';
  }

  ngAfterViewInit() {
    this._nfc = '';
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
    if (this.isActive) {
      if (this.isAuth) {
        await this.generateAndWrite();
      } else {
        console.log('onNfc');
        console.log(JSON.stringify(nfcEvent));

        this._nfc = nfcEvent.tag.id;

        navigator.vibrate(100);

        await this.onSuccess();
      }
    } else {
      console.log('inactive');
    }
  }

  async onNdef(nfcEvent) {
    if (this.isActive) {
      if (this.isAuth) {
        await this.generateAndWrite();
      } else {
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
          this._nfc = tag.id;

          navigator.vibrate(100);

          await this.onSuccess();
        } else {
          const payload = Buffer.from(tag.ndefMessage[0].payload);
          const login = Utils.tryUnpackLogin(payload);

          console.log(login);

          this._nfc = login;

          navigator.vibrate(100);

          await this.onSuccess();
        }
      }
    }
  }

  async generateAndWrite() {
    if (!await Utils.testNetwork()) {
      this.notification.show('No network connection');
      return;
    }
    try {
      do {
        const login = this.authService.makeNewLogin(10);
        const exists = await this.dds.exists(AuthService.toId(login));
        if (!exists) {
          this._nfc = login;
          this.writeTag();
          break;
        }
      } while (true);
    } catch (ignored) {}
  }

  writeTag() {
    const content = Utils.packLogin(this._nfc);
    const payload = Array.from(content);
    const mimeType = 'text/pg';

    const record = ndef.mimeMediaRecord(mimeType, payload);

    nfc.write([record], () => this.ngZone.run(async () => {
      this.notification.show('Success write NFC tag');
      await this.onSuccess();
    }), (e) => this.ngZone.run(() => {
      console.log('Error write ' + JSON.stringify(e));
      this.notification.show('Error write NFC tag');
    }));
  }

  async onSuccess() {
    this.isActive = false;

    switch (this.next) {
      case 'auth':
        this.authService.addAuthFactor(FactorType.NFC, Buffer.from(this._nfc, 'utf-8'));
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        this.authService.addFactor(FactorType.NFC, Buffer.from(this._nfc, 'utf-8'));
        await this.router.navigate(['/registration']);
        break;
      case 'factornode':
        if (this.isAuth) {
          this.authService.addFactor(FactorType.NFC, Utils.packLogin(this._nfc));
        } else {
          this.authService.addFactor(FactorType.NFC, Buffer.from(this._nfc, 'utf-8'));
        }
        await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        break;
      default:
        // if at login-parent
        this.canScanAgain = true;
        this.classNfcContainer = 'invisible';
        this.inputEvent.emit(this._nfc);
    }
  }

  scanAgain() {
    this.canScanAgain = false;
    this.isActive = true;
    this.classNfcContainer = '';
    this.clearEvent.emit();
  }
}
