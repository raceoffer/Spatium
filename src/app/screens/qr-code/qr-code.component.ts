import {Component, EventEmitter, Input, NgZone, OnInit, Output} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';
import {FileService} from '../../services/file.service';
import {KeyChainService} from "../../services/keychain.service";

declare const Utils: any;
declare const cordova: any;
declare const window: any;

@Component({
  selector: 'app-qr-code',
  host: {'class': 'child box content text-center'},
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit {
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

  constructor(private readonly fs: FileService,
              private readonly dds: DDSService,
              private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly ngZone: NgZone,
              private readonly notification: NotificationService,
              private readonly authService: AuthService,
              private readonly keyChainService: KeyChainService) {
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
      const permissions = cordova.plugins.permissions;
      permissions.hasPermission(permissions.CAMERA, (status) => this.ngZone.run(async () => {
        if ( status.hasPermission ) {
          this.permissionCam = true;
        } else {
          this.permissionCam = false;

          await permissions.requestPermission(permissions.CAMERA, this.successCam.bind(this), this.errorCam.bind(this));
        }
      }));
    }
  }

  async writeSecret() {
    const encryptedSeed = await this.keyChainService.getSeed();
    const packSeed = Utils.packSeed(encryptedSeed);
    this.genericValue = packSeed.toString('hex');
    console.log(this.genericValue);
  }

  async generateLogin() {
    if (!await Utils.testNetwork()) {
      this.notification.show('No network connection');
      return;
    }
    try {
      do {
        const login = this.authService.makeNewLogin(10);
        const exists = await this.dds.exists(AuthService.toId(login));
        if (!exists) {
          const packedLogin = Utils.packLogin(login);
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
    if (!status.hasPermission) {
      this.notification.show('Camera permission is not turned on');
      this.ngZone.run(async () => {
        this.permissionCam = false;
      });
    } else {
      this.ngZone.run(async () => {
        this.permissionCam = true;
      });
    }
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

    if (cams && cams.length > 0) {
      this.spinnerClass = 'invisible';
      this.selectedDevice = cams[1];
      this.camStarted = true;
    }
  }

  async handleQrCodeResult(event) {
    if (!this.isRepeatable) {
      this._qrcode = event.toString();
    } else {
      const buffer = Buffer.from(event.toString(), 'hex');
      if(this.isImport) {
        console.log(buffer);
        this._qrcode = Utils.tryUnpackSeed(buffer);
        console.log(this._qrcode);
      } else {
        this._qrcode = Utils.tryUnpackLogin(buffer);
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
        function(msg){
          console.log(msg);
          this.notification.show('Secret was saved as QR');
        }.bind(this),
        function(err){
          console.log(err);
        },
        canvas
      );
    }
  }
}

