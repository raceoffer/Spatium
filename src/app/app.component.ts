import { Component, OnInit } from '@angular/core';
import {BitcoinKeyFragmentService} from './services/bitcoin-key-fragment.service';

declare const cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  host: {
    '(document:deviceready)': 'onDeviceready($event)',
  }
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';

  constructor(private bitcoinKeyService: BitcoinKeyFragmentService) { }

  ngOnInit() {
  }

  onDeviceready(ev) {
    // this.bitcoinKeyService.ready = true;
  }
}
