import { Component, OnInit } from '@angular/core';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {Router} from '@angular/router';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-initiator-auth',
  templateUrl: './initiator-auth.component.html',
  styleUrls: ['./initiator-auth.component.css']
})
export class InitiatorAuthComponent implements OnInit {
  entry = 'initiator-auth';
  create = 'initiator-auth';

  constructor(private router: Router,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService,
              private walletService: WalletService) { }

  ngOnInit() {}

  async onEntryClicked() {}

  async onCreateClicked() {}

  async onGoPinClicked() {
    this.router.navigate(['/pincode']);
  }
}
