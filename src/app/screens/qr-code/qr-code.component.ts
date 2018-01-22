import {AfterViewInit, Component, NgZone,} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {BitcoinKeyFragmentService} from "../../services/bitcoin-key-fragment.service";
import {WalletService} from "../../services/wallet.service";

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements AfterViewInit {

  //https://github.com/chen6516/cordova-zxing-portrait
  _qrcode = '';

  next: string = null;
  back: string = null;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone,
              private authSevice: AuthService,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService,
              private walletService: WalletService) {
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
    this._qrcode = '';
  }

}
