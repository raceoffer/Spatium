import {Component, OnInit, AfterViewInit, NgZone} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';
import {WalletService} from '../../services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit, AfterViewInit {
  stConnect = 'Подключение к ';
  busyClass = 'fade-background invisible';
  name: string;
  address: string;

  constructor(private route: ActivatedRoute,
              private bt: BluetoothService,
              private wallet: WalletService,
              private router: Router,
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
  }

  async ngAfterViewInit() {
    try {
      await this.bt.connect({
        name: this.name,
        address: this.address
      });
    } catch (e) {
      console.log('connect', e);

      this.ngZone.run(() => {
        this.router.navigate(['/waiting']);
      });
    }
  }
}
