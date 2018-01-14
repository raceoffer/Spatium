import { Component, OnInit } from '@angular/core';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {Router} from '@angular/router';

declare const window: any;
declare const CompoundKey: any;

@Component({
  selector: 'app-initiator-auth',
  templateUrl: './verifier-auth.component.html',
  styleUrls: ['./verifier-auth.component.css']
})
export class VerifierAuthComponent implements OnInit {
  pinCode: number;

  constructor(private router: Router,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService) { }

  ngOnInit() {}

  async onSubmitClicked() {
    const keyFragment = CompoundKey.fromSeed(this.pinCode.toString());
    window.plugins.toast.showLongBottom(
      keyFragment.getPrivateKey('base58'),
      3000,
      'bottom',
      console.log(keyFragment.getPrivateKey('base58'))
    );
  }
}
