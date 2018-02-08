import { AfterViewInit, Component, EventEmitter, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

declare const nfc: any;
declare const navigator: any;
declare const Utils: any;

@Component({
  selector: 'app-nfc',
  host: {'class': 'child box'},
  templateUrl: './nfc.component.html',
  styleUrls: ['./nfc.component.css']
})
export class NfcComponent implements AfterViewInit, OnInit, OnDestroy {
  _nfc = '';
  entry = 'Sign in';
  buttonState = 0; // sign in = 0, sign up = 1
  next: string = null;
  back: string = null;
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
    private readonly notification: NotificationService
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
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
        this.onNdef.bind(this),
        function () {
          console.log('Listening for NDEF tags.');
        },
        this.failure
      );

      nfc.addTagDiscoveredListener(
        this.onNfc.bind(this),
        function () {
          console.log('Listening for non-NDEF tags.');
        },
        this.failure
      );

      nfc.addMimeTypeListener(
        'text/pg',
        this.onNdef.bind(this),
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
      nfc.enabled(function () {
        this.ngZone.run(async () => {
          this.disabledNFC = false;
        });
      }.bind(this), function () {
        this.ngZone.run(async () => {
          this.disabledNFC = true;
        });
      }.bind(this));
  }

  changeNFCState() {
    nfc.showSettings();
  }

  failure(reason) {
    console.log('There was a problem ' + reason);
  }

  onNfc (nfcEvent) {
    if (this.isActive) {
      console.log('onNfc');
      console.log(JSON.stringify(nfcEvent));

      this._nfc = nfcEvent.tag.id;

      navigator.vibrate(100);

      this.onSuccess();
    } else {
      console.log('inactive');
    }
  }

  onNdef (nfcEvent) {
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

      this._nfc = tag.id;

      navigator.vibrate(100);

      this.onSuccess();
    }
  }

  onSuccess() {
    this.isActive = false;

    if (this.next && this.next === 'auth') {
      this.authService.addAuthFactor(FactorType.NFC, Buffer.from(this._nfc, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else if (this.next && this.next === 'registration') {
      this.authService.addFactor(FactorType.NFC, Buffer.from(this._nfc, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/registration']);
      });
    } else {
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
