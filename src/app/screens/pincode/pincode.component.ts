import {Component, Input, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {WalletService} from '../../services/wallet.service';
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements AfterViewInit {
  _pincode = '';

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
    this._pincode = '';
  }

  get Pincode() {
    return this._pincode;
  }

  @Input()
  set Pincode(newPin) {
    this._pincode = newPin;
  }

  onAddClicked(symbol) {
    this._pincode = this._pincode + symbol;
  }

  onBackspaceClicked() {
    this._pincode = this._pincode.substr(0, this._pincode.length - 1);
  }

  async onSubmitClicked() {
    if (this.next && this.next === 'waiting') {
      const keyFragment = await this.bitcoinKeyFragmentService.keyringFromSeed(this._pincode.toString());
      this.walletService.setKeyFragment(keyFragment);
      await this.router.navigate(['/verifyTransaction']);
    } else if (this.next && this.next === 'auth') {
      this.authSevice.addFactor(AuthService.FactorType.PIN, this._pincode.toString());

      this.ngZone.run(async () => {
        await this.router.navigate(['/auth']);
      });
    }
  }

}
