import { Component, OnInit, NgZone } from '@angular/core';
import { WalletService, Status } from '../../services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {
  stConnect = 'Connecting to the device';
  cancelLabel = 'Cancel';
  busyClass = 'fade-background invisible';

  progress = 0;

  constructor(
    private wallet: WalletService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.wallet.onStatus.subscribe(status => this.ngZone.run(() => {
      this.progress = Math.max(Math.min(Math.round(status * 100 / (Status.Finished - Status.None + 1)), 100), 0);
    }));
  }

  async cancelSync() {
    await this.wallet.cancelSync();
  }
}
