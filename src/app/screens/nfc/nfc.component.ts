import {AfterContentInit, AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {FileService} from "../../services/file.service";
import {NotificationService} from "../../services/notification.service";

declare const nfc: any;
declare const navigator: any;
declare const Utils: any;

@Component({
  selector: 'app-nfc',
  host: {'class':'child'},
  templateUrl: './nfc.component.html',
  styleUrls: ['./nfc.component.css']
})
export class NfcComponent implements AfterViewInit, AfterContentInit, OnInit {

  _nfc = '';
  entry = 'Sign in';
  buttonState = 0; //sign in = 0, sign up = 1
  next: string = null;
  back: string = null;
  text = 'Touch an NFC tag';
  isActive = false;
  isCreatedListener = false;
  isCheckingInProcess = true;

  isDisable = false;
  isRepeatable = false;
  canScanAgain = false;
  classNfcContainer ='';

  constructor(private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private readonly fs: FileService,
    private readonly notification: NotificationService,) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });

  }

  ngOnInit(){
    this.canScanAgain = false;
    this.classNfcContainer = '';
  }

  ngAfterContentInit() {
    if (this.next == null && this.back == null){
      this.isRepeatable = true;
    }
  }

  ngAfterViewInit() {
    this._nfc = '';
    this.isActive = true;

    nfc.enabled(function () {
      console.log("on");
    }, function () {
      nfc.showSettings();
    });

    if (!this.isCreatedListener) {
      nfc.addNdefListener(
        this.onNdef.bind(this),
        function () {
          console.log("Listening for NDEF tags.");
        },
        this.failure
      );

      nfc.addTagDiscoveredListener(
        this.onNfc.bind(this),
        function () {
          console.log("Listening for non-NDEF tags.");
        },
        this.failure
      );

      nfc.addMimeTypeListener(
        'text/pg',
        this.onNdef.bind(this),
        function () {
          console.log("Listening for NDEF mime tags with type text/pg.");
        },
        this.failure
      );
      this.isCreatedListener = true;
    }
  }

  failure(reason) {
    console.log('There was a problem '+reason)
  }

  onNfc (nfcEvent) {
    if (this.isActive) {
      console.log("onNfc");
      console.log(JSON.stringify(nfcEvent));

      this._nfc = nfcEvent.tag.id;

      //navigator.vibrate(100);

      this.onSuccess();
    } else {
      console.log("inactive");
    }
  }

  onNdef (nfcEvent) {
    if (this.isActive) {
      console.log("onNdef");
      console.log(JSON.stringify(nfcEvent));

      var tag = nfcEvent.tag;

      // BB7 has different names, copy to Android names
      if (tag.serialNumber) {
        tag.id = tag.serialNumber;
        tag.isWritable = !tag.isLocked;
        tag.canMakeReadOnly = tag.isLockable;
      }

      this._nfc = tag.id;

      //navigator.vibrate(100);

      this.onSuccess();
    }
  }

  onSuccess(){
    this.isActive = false;

    if (this.next && this.next === 'auth') {
      this.authService.addFactor(AuthService.FactorType.NFC, this._nfc.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else {
      //if at login-parent
      this.canScanAgain = true;
      this.classNfcContainer = 'invisible'
      this.isCheckingInProcess = true;
      this.checkingLogin();
    }
  }

  async checkingLogin(){
    //logic for buttonState 0 and 1;
    await this.delay(2000);
    this.entry = 'Sign Up';
    this.isCheckingInProcess = false;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  scanAgain(){
    this.canScanAgain = false;
    this.isActive = true;
    this.classNfcContainer = '';
    this.isCheckingInProcess = true;
  }

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  async letLogin() {
    //logic for buttonState 0 and 1;
    this.isDisable = true;
    if(this._nfc != '') {
      if (await NfcComponent.isEthernetAvailable()) {
        this.authService.nfc = this._nfc;
        this.authService.clearFactors();

        try {
          this.authService.encryptedSeed = await this.fs.readFile(this.fs.safeFileName(this._nfc));
        } catch (e) {
          this.authService.encryptedSeed = null;
          this.notification.show('No stored seed found');
        }

        await this.router.navigate(['/auth']);
      } else {
        this.notification.show('No connection');
      }
    }
    this.isDisable = false;
  }
}
