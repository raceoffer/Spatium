import {AfterContentInit, AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild,} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";


@Component({
  selector: 'app-qr-code',
  host: {'class':'child'},
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit, AfterViewInit, AfterContentInit {

  _qrcode = '';
  isRepeatable = false;
  canScanAgain = false;
  classVideoContainer ='';
  classVideo = '';

  next: string = null;
  back: string = null;

  camStarted = false;
  selectedDevice = undefined;
  availableDevices = [];
  text = 'Place the QR-code into the square';
  spinnerClass = '';

  @ViewChild('videoContainer') el: ElementRef;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone,
              private authService: AuthService) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
    this.classVideo = 'small-video';
    this.spinnerClass = 'small-video-container';
  }

  ngOnInit(){
    this.canScanAgain = false;
    this.classVideoContainer = '';
  }

  ngAfterContentInit() {
    let el = document.querySelector('video');
    el.setAttribute('poster', '#');

    if (this.next == null && this.back == null){
      this.isRepeatable = true;
    }
  }

  ngAfterViewInit() {
    this._qrcode = '';
  }

  displayCameras(cams: any[]){
    this.availableDevices = cams;

    if(cams && cams.length > 0) {
      this.spinnerClass = "invisible";
      this.selectedDevice = cams[1];
      this.camStarted = true;
    }
  }

  async handleQrCodeResult(event){
    this._qrcode = event.toString();

    this.camStarted = false;

     if (this.next && this.next === 'auth') {
      this.authService.addFactor(AuthService.FactorType.QR, this._qrcode.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else {
       //if at login-parent
       this.authService.qr = this._qrcode.toString();
       this.authService.clearFactors();
       this.canScanAgain = true;
       this.classVideoContainer = 'invisible'
     }
  }

  pause(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
      now = new Date();
      if (now.getTime() > exitTime)
        return;
    }
  }

  scanAgain(){
    console.log('qr '+this.authService.qr);
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this.camStarted = true;
  }

}
