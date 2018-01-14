import { Component, OnInit } from '@angular/core';
import {BitcoinKeyFragmentService} from '../../services/bitcoin-key-fragment.service';
import {Router} from '@angular/router';
import {WalletService} from '../../services/wallet.service';

declare const window: any;
declare const cordova: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit() {
  }

  async onOpenClicked() {
    this.router.navigate(['/initiator-auth']);
  }

  async onConnectClicked() {
    this.router.navigate(['/verifier-auth']);
  }
}
