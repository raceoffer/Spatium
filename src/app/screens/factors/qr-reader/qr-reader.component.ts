import { Component, EventEmitter, HostBinding, Input, NgZone, OnInit, Output } from '@angular/core';
import { FactorType } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

declare const CryptoCore: any;
declare const cordova: any;
declare const window: any;
declare const Buffer: any;

@Component({
  selector: 'app-qr-reader',
  templateUrl: './qr-reader.component.html',
  styleUrls: ['./qr-reader.component.css']
})
export class QrReaderComponent implements OnInit {

  @HostBinding('class') classes = 'content factor-content text-center';

  @Input() isImport = false;
  @Input() isRepeatable = false;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();

  qrcode: string = null;
  canScanAgain = false;
  classVideoContainer = '';
  classVideo = '';

  camStarted = false;
  selectedDevice = undefined;
  availableDevices = [];
  text = 'Scan a QR-code';
  spinnerClass = '';
  permissionCam = false;

  constructor(private readonly ngZone: NgZone,
              private readonly notification: NotificationService) {
  }

  async ngOnInit() {
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this.qrcode = '';
    this.classVideo = 'small-video';
    this.spinnerClass = 'spinner-video-container';

    const permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.CAMERA, (status) => this.ngZone.run(async () => {
      if (status.hasPermission) {
        this.permissionCam = true;
      } else {
        this.permissionCam = false;

        await permissions.requestPermission(permissions.CAMERA, this.successCam.bind(this), this.errorCam.bind(this));
      }
    }));

  }


  addVideoContainer() {
    const el = document.querySelector('video');
    el.setAttribute('poster', '#');
  }

  errorCam() {
    this.notification.show('Camera permission is not turned on');
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

  scanAgain() {
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this.camStarted = true;
    this.clearEvent.emit();
  }

  displayCameras(cams: any[]) {
    this.availableDevices = cams;

    console.log(cams);

    if (cams && cams.length > 0) {
      this.spinnerClass = 'invisible';
      this.selectedDevice = cams[1];
      this.camStarted = true;
    }
  }

  async handleQrCodeResult(event) {
    if (!this.isRepeatable) {
      this.qrcode = event.toString();
    } else {
      const buffer = Buffer.from(event.toString(), 'hex');
      if (this.isImport) {
        try {
          console.log(buffer);
          const value = await CryptoCore.Utils.tryUnpackEncryptedSeed(buffer);
          this.qrcode = value.toString('hex');
          console.log(this.qrcode);
        } catch (exc) {
          console.log(exc);
          this.qrcode = null;
        }
      } else {
        this.qrcode = await CryptoCore.Utils.tryUnpackLogin(buffer);
      }
    }
    await this.onNext();
  }

  async onNext() {
    this.camStarted = false;

    if (this.inputEvent) {
      this.canScanAgain = true;
      this.classVideoContainer = 'invisible';
      this.inputEvent.emit(this.qrcode);
    }

    if (this.onSuccess) {
      this.onSuccess.emit({factor: FactorType.QR, value: Buffer.from(this.qrcode, 'utf-8')});
    }
  }



}
