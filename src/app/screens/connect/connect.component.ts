import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {BluetoothService} from '../../services/bluetooth.service';

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

  async ngAfterViewInit() {
    try {
      await this.bt.connect({
        name: this.name,
        address: this.address
      });
      this.router.navigate(['/send']);
    } catch (e) {
      console.log('connect', e);
      this.router.navigate(['/waiting']);
    }
  }

  constructor(private route: ActivatedRoute,
              private bt: BluetoothService,
              private router: Router) { }

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params); // {order: "popular"}

        this.name = params.name;
        this.stConnect = this.stConnect + this.name;
        console.log(this.name); // popular
        this.address = params.address;
        console.log(this.address); // popular
      });
  }



}
