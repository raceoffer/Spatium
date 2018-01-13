import { Component, OnInit } from '@angular/core';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {Router} from '@angular/router';
import {WalletService} from '../../services/wallet.service';

declare var window: any;
declare var cordova: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  entry = 'Login';
  create = 'Create';
  inProgress = false;

  constructor(private router: Router,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService,
              private walletService: WalletService) { }

  ngOnInit() {
  }

  async onEntryClicked() {
    try {
      this.inProgress = true;
      this.entry = 'Logging in';
      const bitcoinKeyFragment = await this.bitcoinKeyFragmentService.loadBitcoinKeyFragment();
      this.walletService.setKeyFragment(bitcoinKeyFragment);
      this.router.navigate(['/waiting']);
    } catch (e) {
      window.plugins.toast.showLongBottom(e.message, 3000, 'bottom', console.log(e.message));
    }
    finally {
      this.inProgress = false;
      this.entry = 'Login';
    }
  }

  async onCreateClicked() {
    try {
      this.inProgress = true;
      this.create = 'Creating';
      const bitcoinKeyFragment = await this.bitcoinKeyFragmentService.generateBitcoinKeyFragment();
      this.walletService.setKeyFragment(bitcoinKeyFragment);
      this.router.navigate(['/backup']);
    }
    finally {
      this.inProgress = false;
      this.create = 'Create';
    }
  }
}
