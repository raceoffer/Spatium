import { Component, EventEmitter, NgZone, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;
declare const cordova: any;

@Component({
  selector: 'app-qr-code',
  host: {'class': 'child box'},
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

  camStarted = false;
  selectedDevice = undefined;
  availableDevices = [];
  text = 'Scan a QR-code';
  spinnerClass = '';
  permissionCam = false;

  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() buisyEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();

  constructor(
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
    });

    if (this.next == null && this.back == null) {
      this.isRepeatable = true;
    }
  }

  ngOnInit() {
    this.canScanAgain = false;
    this.classVideoContainer = 'content';
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

        permissions.requestPermission(permissions.CAMERA, this.success.bind(this), this.error.bind(this));
      }
    }.bind(this));
  }

  addVideoContainer() {
    const el = document.querySelector('video');
    el.setAttribute('poster', '#');
  }

  error() {
    this.notification.show('Camera permission is not turned on');
  }

  success( status ) {
    if ( !status.hasPermission ) {
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
      this.authService.addAuthFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else if (this.next && this.next === 'registration') {
      this.authService.addFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/registration']);
      });
    } else if (this.next && this.next === 'factornode') {
      this.authService.addFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/factornode']);
      });
    } else {
       // if at login-parent
       this.canScanAgain = true;
       this.classVideoContainer = 'invisible';
       this.inputEvent.emit(this._qrcode);
    }
  }

  scanAgain() {
    console.log('qr ' + this.authService.qr);
    this.canScanAgain = false;
    this.classVideoContainer = 'content';
    this.camStarted = true;
    this.clearEvent.emit();
  }
}

