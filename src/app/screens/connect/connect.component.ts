import { Component, OnInit, NgZone} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  name: string;
  address: string;

  progress = 0;

  constructor(private route: ActivatedRoute,
              private wallet: WalletService,
              private ngZone: NgZone) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log(params); // {order: "popular"}

      this.name = params.name;
      this.stConnect = this.stConnect + this.name;
      console.log(this.name); // popular
      this.address = params.address;
      console.log(this.address); // popular
    });

    this.wallet.onStatus.subscribe((status) => this.ngZone.run(() => {
      this.progress = Math.max(Math.min(Math.round(status * 100 / (Status.Finished - Status.None + 1)), 100), 0);
    }));
  }

  cancelSync() {
    this.wallet.cancelSync();
  }
}
