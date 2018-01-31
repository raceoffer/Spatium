import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService, FactorType} from '../../services/auth.service';
import {FileService} from '../../services/file.service';
import {NotificationService} from '../../services/notification.service';

declare const Utils: any;
declare const cordova: any;

@Component({
  selector: 'app-qr-code',
  host: {'class': 'child'},
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit {

  entry = 'Sign in';
  buttonState = 0; // sign in = 0, sign up = 1
  isDisable = false; // button state

  _qrcode: string = null;
  isRepeatable = false;
  canScanAgain = false;
  isCheckingInProcess = true;
  classVideoContainer = '';
  classVideo = '';

  next: string = null;
  back: string = null;

  camStarted = false;
  selectedDevice = undefined;
  availableDevices = [];
  text = 'Scan a QR-code';
  spinnerClass = '';
  permissionCam = false;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone,
              private readonly fs: FileService,
              private readonly notification: NotificationService,
              private authService: AuthService) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });

    if (this.next == null && this.back == null) {
      this.isRepeatable = true;
    }
  }

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  ngOnInit() {
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this._qrcode = '';
    this.classVideo = 'small-video';
    this.spinnerClass = 'spinner-video-container';

    const permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.CAMERA, function( status ){
      if ( status.hasPermission ) {
        this.ngZone.run(async () => {
          this.permissionCam = true;
        });
      } else {
        this.ngZone.run(async () => {
          this.permissionCam = false;
        });

        permissions.requestPermission(permissions.CAMERA, this.success.bind(this), this.error);
      }
    }.bind(this));
  }

  addVideoContainer() {
    const el = document.querySelector('video');
    el.setAttribute('poster', '#');
  }

  error() {
    console.warn('Camera permission is not turned on');
  }

  success( status ) {
    if ( !status.hasPermission ) {
      console.warn('Camera permission is not turned on');
      this.ngZone.run(async () => {
        this.permissionCam = false;
      });
    } else {
      this.ngZone.run(async () => {
        this.permissionCam = true;
      });
    }
  }

  displayCameras(cams: any[]) {
    this.availableDevices = cams;

    if (cams && cams.length > 0) {
      this.spinnerClass = 'invisible';
      this.selectedDevice = cams[1];
      this.camStarted = true;
    }
  }

  async handleQrCodeResult(event) {
    this._qrcode = event.toString();

    this.camStarted = false;

    if (this.next && this.next === 'auth') {
      this.authService.addFactor(FactorType.QR, this._qrcode.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else {
       // if at login-parent
       this.canScanAgain = true;
       this.classVideoContainer = 'invisible';
       this.isCheckingInProcess = true;
       this.checkingLogin();
    }
  }

  async checkingLogin() {
    // logic for buttonState 0 and 1;
    await this.delay(2000);
    this.entry = 'Sign Up';
    this.isCheckingInProcess = false;
    }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  scanAgain() {
    console.log('qr ' + this.authService.qr);
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this.camStarted = true;
    this.isCheckingInProcess = true;
}



  async letLogin() {
    // logic for buttonState 0 and 1;
    this.isDisable = true;
    if (this._qrcode) {
      if (await QrCodeComponent.isEthernetAvailable()) {
        this.authService.qr = this._qrcode;
        this.authService.clearFactors();

        try {
          this.authService.encryptedSeed = await this.fs.readFile(this.fs.safeFileName(this._qrcode));
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

