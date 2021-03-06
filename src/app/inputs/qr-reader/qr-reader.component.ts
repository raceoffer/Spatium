import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import { DeviceService, Platform } from '../../services/device.service';
import { SettingsService } from '../../services/settings.service';
import { checkPermission, Permission, requestPermission } from '../../utils/permissions';

declare const cordova: any;
declare const window: any;
declare const Windows: any;

@Component({
  selector: 'app-qr-reader',
  templateUrl: './qr-reader.component.html',
  styleUrls: ['./qr-reader.component.css']
})
export class QrReaderComponent implements AfterViewInit {
  @Output() scanned: EventEmitter<string> = new EventEmitter<string>();
  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() error: EventEmitter<any> = new EventEmitter<any>();

  constructor(private readonly deviceService: DeviceService,
              private readonly settings: SettingsService) {}

  async ngAfterViewInit() {
    if (this.deviceService.platform !== Platform.Windows && !await checkPermission(Permission.Camera)) {
      await requestPermission(Permission.Camera);
    }
  }

  async scan() {
    return await new Promise<any>((resolve, reject) => cordova.plugins.barcodeScanner.scan(
      resolve,
      reject,
      {
        preferFrontCamera: false, // iOS and Android
        showFlipCameraButton: true, // iOS and Android
        showTorchButton: true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: false, // Android, save scan history (default false)
        prompt: 'Place a barcode inside the scan area', // Android
        resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        disableAnimations: true, // iOS
        disableSuccessBeep: false // iOS and Android
      }
    ));
  }

  async onScan() {
    if (this.deviceService.platform !== Platform.Windows && !await checkPermission(Permission.Camera)) {
      await requestPermission(Permission.Camera);
    } else {
      try {
        const result = await this.scan();
        if (!result.cancelled) {
          this.scanned.next(result.text);
        } else {
          this.cancelled.next();
        }
      } catch (e) {
        this.error.next(e);
        if (this.deviceService.platform === Platform.Windows) {
          const stored = await this.settings.accessWinWebcam();
          if (stored) {
            this.goToAppSettings();
          } else {
            await this.settings.setAccessWinWebcam(true);
          }
        }
      }
    }
  }

  goToAppSettings() {
    const uriToLaunch = 'ms-settings:appsfeatures-app';
    const uri = new Windows.Foundation.Uri(uriToLaunch);
    Windows.System.Launcher.launchUriAsync(uri);
  }
}
