import {AfterViewInit, Component, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

declare const nfc: any;
declare const navigator: any;

@Component({
  selector: 'app-nfc',
  host: {'class':'child'},
  templateUrl: './nfc.component.html',
  styleUrls: ['./nfc.component.css']
})
export class NfcComponent implements AfterViewInit {

  _nfc = '';
  next='';
  back='';
  text = 'Touch an NFC tag';
  isActive = false;
  isCreatedListener = false;

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

  }

  ngAfterViewInit() {
    this._nfc = '';
    this.isActive = true;

    nfc.enabled(function () {
      console.log("on");
    }, function () {
      nfc.showSettings();
    });

    if (!this.isCreatedListener) {
      nfc.addNdefListener(
        this.onNdef.bind(this),
        function () {
          console.log("Listening for NDEF tags.");
        },
        this.failure
      );

      nfc.addTagDiscoveredListener(
        this.onNfc.bind(this),
        function () {
          console.log("Listening for non-NDEF tags.");
        },
        this.failure
      );

      nfc.addMimeTypeListener(
        'text/pg',
        this.onNdef.bind(this),
        function () {
          console.log("Listening for NDEF mime tags with type text/pg.");
        },
        this.failure
      );
      this.isCreatedListener = true;
    }
  }

  failure(reason) {
    console.log('There was a problem '+reason)
  }

  onNfc (nfcEvent) {
    if (this.isActive) {
      console.log("onNfc");
      console.log(JSON.stringify(nfcEvent));

      this._nfc = nfcEvent.tag.id;

      //navigator.vibrate(100);

      this.onSuccess();
    } else {
      console.log("inactive");
    }
  }

  onNdef (nfcEvent) {
    if (this.isActive) {
      console.log("onNdef");
      console.log(JSON.stringify(nfcEvent));

      var tag = nfcEvent.tag;

      // BB7 has different names, copy to Android names
      if (tag.serialNumber) {
        tag.id = tag.serialNumber;
        tag.isWritable = !tag.isLocked;
        tag.canMakeReadOnly = tag.isLockable;
      }

      this._nfc = tag.id;

      //navigator.vibrate(100);

      this.onSuccess();
    }
  }

  onSuccess(){
    this.isActive = false;

    if (this.next && this.next === 'auth') {
      this.authService.addFactor(AuthService.FactorType.NFC, this._nfc.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    } else {
      //if at login-parent
      this.authService.nfc = this._nfc.toString();
      this.authService.clearFactors();
    }
  }
}
