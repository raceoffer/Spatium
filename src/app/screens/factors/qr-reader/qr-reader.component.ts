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
  private subscriptions = [];

  @Input() isImport = false;
  @Input() isRepeatable = false;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();
  @Output() startScanEvent: EventEmitter<any> = new EventEmitter<any>();

  qrcode: string = null;
  canScanAgain = false;
  camStarted = false;
  text = 'Scan a QR-code';
  permissionCam = false;

  constructor(private readonly ngZone: NgZone,
              private readonly notification: NotificationService) {
  }

  async ngOnInit() {
    this.canScanAgain = true;
    this.qrcode = '';

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
    this.startScanEvent.emit();
    this.canScanAgain = false;
    this.camStarted = true;
    this.clearEvent.emit();
    cordova.plugins.barcodeScanner.scan((result) => this.handleQrCodeResult(result),
      (error) => console.log('qr scan error: ' + JSON.stringify(error)),
        {
          preferFrontCamera : false, // iOS and Android
          showFlipCameraButton : true, // iOS and Android
          showTorchButton : true, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          saveHistory: false, // Android, save scan history (default false)
          prompt : 'Place a barcode inside the scan area', // Android
          resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          // formats : 'QR_CODE,PDF_417', // default: all but PDF_417 and RSS_EXPANDED
          // orientation : 'landscape', // Android only (portrait|landscape), default unset so it rotates with the device
          disableAnimations : true, // iOS
          disableSuccessBeep: false // iOS and Android
      }
    );
  }

  async handleQrCodeResult(result) {
    if (result.cancelled) {
      this.ngZone.run(async () => {
        this.canScanAgain = true;
      });
      return;
    }

    if (!this.isRepeatable) {
      this.qrcode = result.text;
    } else {
      const buffer = Buffer.from(result.text, 'hex');
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
      this.inputEvent.emit(this.qrcode);
    }

    if (this.onSuccess) {
      this.onSuccess.emit({factor: FactorType.QR, value: this.qrcode});
    }
  }
}
