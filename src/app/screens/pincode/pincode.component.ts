import {Component, Input, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements AfterViewInit {
  pincode = '';

  next: string = null;
  back: string = null;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone,
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
    this.pincode = '';
  }

  get Pincode() {
    return this.pincode;
  }

  @Input()
  set Pincode(newPin) {
    this.pincode = newPin;
  }

  onAddClicked(symbol) {
    this.pincode = this.pincode + symbol;
  }

  onBackspaceClicked() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
  }

  async onSubmitClicked() {
    if (this.next && this.next === 'waiting') {
      const keyFragment = await this.bitcoinKeyFragmentService.keyringFromSeed(this.pincode.toString());
      this.walletService.setKeyFragment(keyFragment);
      this.router.navigate(['/waiting']);
    }
  }

}
