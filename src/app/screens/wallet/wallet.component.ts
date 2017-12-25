import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  title = 'Wallet';
  bitcoinAddress = 'djkshfdjfhdsfjsd';
  bitcoinBalance = '300';
  syncState = 0;

  constructor() { }

  ngOnInit() {
  }

  changeSyncState(): void {
    switch (this.syncState){
      case 0: {
        this.syncState = 1;
        break;
      }
      case 1: {
        this.syncState = 2;
        break;
      }
      case 2: {
        this.syncState = 0;
        break;
      }
    }
  }
}
