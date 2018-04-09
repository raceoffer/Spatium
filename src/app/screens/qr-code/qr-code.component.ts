import { Component, EventEmitter, Input, NgZone, OnInit, OnDestroy, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';

declare const CryptoCore: any;
declare const cordova: any;
declare const window: any;
declare const Buffer: any;

@Component({
  selector: 'app-qr-code',
  host: {'class': 'child box content text-center'},
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit, OnDestroy {
  entry = 'Sign in';

  _qrcode: string = null;
  isRepeatable = false;
  canScanAgain = false;
  classVideoContainer = 'content';
  classVideo = '';

  next: string = null;
  back: string = null;
  isAuth = false;

  camStarted = false;
  selectedDevice = undefined;
  availableDevices = [];
  text = 'Scan a QR-code';
  spinnerClass = '';
  permissionCam = false;
  _permissionCStorage = false;
  genericValue = '';

  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() buisyEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();
  @Input() isExport = false;
  @Input() isImport = false;

  constructor(
    private readonly dds: DDSService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly notification: NotificationService,
    private readonly authService: AuthService
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

    if (this.next == null && this.back == null) {
      this.isRepeatable = true;
    }
  }

  async ngOnInit() {
    this.canScanAgain = false;
    this.classVideoContainer = 'content';
    this._qrcode = '';
    this.classVideo = 'small-video';
    this.spinnerClass = 'spinner-video-container';

    if (this.isAuth) {
      await this.generateLogin();
    } else if (this.isExport) {
      await this.writeSecret();
    } else {
      // const permissions = cordova.plugins.permissions;
      // permissions.hasPermission(permissions.CAMERA, (status) => this.ngZone.run(async () => {
      //   if ( status.hasPermission ) {
      //     this.permissionCam = true;
      //   } else {
      //     this.permissionCam = false;

      //     await permissions.requestPermission(permissions.CAMERA, this.successCam.bind(this), this.errorCam.bind(this));
      //   }
      // }));

      this.ngZone.run(async () => {
        this.permissionCam = true;
      });
    }
  }

  ngOnDestroy() {
    console.log('I\'m being destroyed!');
  }

  async writeSecret() {
    const encryptedSeed = this.authService.encryptedSeed;
    const buffesSeed = Buffer.from(encryptedSeed, 'hex');
    const packSeed = CryptoCore.Utils.packSeed(buffesSeed);
    this.genericValue = packSeed.toString('hex');
    console.log(this.genericValue);
  }

  async generateLogin() {
    if (!await CryptoCore.Utils.testNetwork()) {
      this.notification.show('No network connection');
      return;
    }
    try {
      do {
        const login = this.authService.makeNewLogin(10);
        const exists = await this.dds.exists(AuthService.toId(login));
        if (!exists) {
          const packedLogin = CryptoCore.Utils.packLogin(login);
          this.genericValue = packedLogin.toString('hex');
          break;
        }
      } while (true);
    } catch (ignored) {
    }
  }

  addVideoContainer() {
    const el = document.querySelector('video');
    el.setAttribute('poster', '#');
  }

  errorCam() {
    this.notification.show('Camera permission is not turned on');
  }

  errorStorage() {
    this.notification.show('Storage permission is not turned on');
  }

  successCam(status) {
    this.ngZone.run(async () => {
      this.permissionCam = true;
    });
    // if (!status.hasPermission) {
    //   this.notification.show('Camera permission is not turned on');
    //   this.ngZone.run(async () => {
    //     this.permissionCam = false;
    //   });
    // } else {
    //   this.ngZone.run(async () => {
    //     this.permissionCam = true;
    //   });
    // }
  }

  successStorage(status) {
    if (!status.hasPermission) {
      this.notification.show('Storage permission is not turned on');
      this.ngZone.run(async () => {
        this._permissionCStorage = false;
      });
    } else {
      this.ngZone.run(async () => {
        this._permissionCStorage = true;
        this.saveToStorage();
      });
    }
  }

  displayCameras(cams: any[]) {
    this.availableDevices = cams;

    console.log(cams[0]);

    if (!cams || cams.length === 0) {
      console.log('no cameras');
      return;
    }

    this.spinnerClass = 'invisible';

    for (const cam of cams) {
      console.log('camera label: ' + cam.label);
      if (/back|rear|environment/gi.test(cam.label)) {
        this.selectedDevice = cam;
        break;
      }
    }

    if (this.selectedDevice === undefined) {
      this.selectedDevice = cams.length > 1 ? cams[1] : cams[0];
    }

    this.camStarted = true;
}

  async handleQrCodeResult(event) {
    if (!this.isRepeatable) {
      this._qrcode = event.toString();
    } else {
      const buffer = Buffer.from(event.toString(), 'hex');
      if (this.isImport) {
        try {
          console.log(buffer);
          const value = CryptoCore.Utils.tryUnpackEncryptedSeed(buffer);
          this._qrcode = value.toString('hex');
          console.log(this._qrcode);
        } catch (exc) {
          console.log(exc);
          this._qrcode = null;
        }
      } else {
        this._qrcode = CryptoCore.Utils.tryUnpackLogin(buffer);
      }
    }
    await this.onSuccess();
  }

  async onSuccess() {
    this.camStarted = false;

    switch (this.next) {
      case 'auth':
        this.authService.addAuthFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));
        await this.router.navigate(['/auth']);
        break;
      case 'registration':
        this.authService.addFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));
        await this.router.navigate(['/registration']);
        console.log('after await this.router.navigate([/registration]);');
        break;
      case 'factornode':
        if (this.isAuth) {
          this.authService.addFactor(FactorType.QR, Buffer.from(this.genericValue, 'hex'));
        } else {
          this.authService.addFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));
        }
        await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
        break;
      default:
       // if at login-parent
       this.canScanAgain = true;
       this.classVideoContainer = 'invisible';
       this.inputEvent.emit(this._qrcode);
    }
  }

  scanAgain() {
    this.canScanAgain = false;
    this.classVideoContainer = 'content';
    this.camStarted = true;
    this.clearEvent.emit();
  }

  async saveQr() {
    this.requestStorage();
  }

  requestStorage() {
    const permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, (status) => this.ngZone.run(() => {
      if ( status.hasPermission ) {
        this._permissionCStorage = true;
        this.saveToStorage();
      } else {
        this._permissionCStorage = false;

        permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, this.successStorage.bind(this), this.errorStorage.bind(this));
      }
    }));
  }

  saveToStorage() {
    console.log(this._permissionCStorage);
    if (this._permissionCStorage) {
      const canvas = document.getElementsByTagName('canvas')[0];
      window.canvas2ImagePlugin.saveImageDataToLibrary(
        function(msg) {
          console.log(msg);
          this.notification.show('Secret has been saved as QR image');
        }.bind(this),
        function(err) {
          console.log(err);
        },
        canvas
      );
    }
  }
}

