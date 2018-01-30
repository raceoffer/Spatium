import {AfterContentInit, Component, ElementRef, NgZone, OnInit, ViewChild,} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {FileService} from "../../services/file.service";
import {NotificationService} from "../../services/notification.service";

declare const Utils: any;

@Component({
  selector: 'app-qr-code',
  host: {'class':'child'},
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit, AfterContentInit {

  entry = 'Sign in';
  buttonState = 0; //sign in = 0, sign up = 1
  isDisable = false;

  _qrcode = '';
  isRepeatable = false;
  canScanAgain = false;
  isCheckingInProcess = true;
  classVideoContainer ='';
  classVideo = '';

  next: string = null;
  back: string = null;

  camStarted = false;
  selectedDevice = undefined;
  availableDevices = [];
  text = 'Scan a QR-code';
  spinnerClass = '';

  @ViewChild('videoContainer') el: ElementRef;

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

    if (this.next == null && this.back == null){
      this.isRepeatable = true;
    }
  }

  ngOnInit(){
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this._qrcode = '';
    this.classVideo = 'small-video';
    this.spinnerClass = 'small-video-container';
  }

  ngAfterContentInit() {
    let el = document.querySelector('video');
    el.setAttribute('poster', '#');
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
       this.canScanAgain = true;
       this.classVideoContainer = 'invisible'
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
    console.log('qr '+this.authService.qr);
    this.canScanAgain = false;
    this.classVideoContainer = '';
    this.camStarted = true;
    this.isCheckingInProcess = true;
  }

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  async letLogin() {
    //logic for buttonState 0 and 1;
    this.isDisable = true;
    if(this._qrcode != '') {
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
