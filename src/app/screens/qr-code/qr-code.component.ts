import { AfterContentInit, AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';


@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements AfterViewInit, AfterContentInit {
  _qrcode = '';

  next: string = null;
  back: string = null;

  camStarted = false;
  selectedDevice = undefined;
  qrResult = '';
  availableDevices = [];
  text = 'Place the QR-code into the square';
  spinnerClass = '';

  @ViewChild('videoContainer') el: ElementRef;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone,
              private authSevice: AuthService) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

  ngAfterContentInit() {
    const el = document.querySelector('video');
    el.setAttribute('poster', '#');
    this.spinnerClass = 'small-video-container';

  }

  ngAfterViewInit() {
    this._qrcode = '';
  }

  displayCameras(cams: any[]) {
    this.availableDevices = cams;

    if (cams && cams.length > 0) {
      this.selectedDevice = cams[1];
      this.camStarted = true;
      this.spinnerClass = 'invisible';
    }
  }

  async letWait() {
    this.pause(2000);
  }

  async handleQrCodeResult(event) {
    this._qrcode = event.toString();

    this.camStarted = false;

     if (this.next && this.next === 'auth') {
      this.authSevice.addFactor(FactorType.QR, Buffer.from(this._qrcode, 'utf-8'));

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    }
  }

  pause(numberMillis) {
    let now = new Date();
    const exitTime = now.getTime() + numberMillis;
    while (true) {
      now = new Date();
      if (now.getTime() > exitTime) {
        return;
      }
    }
  }

}
