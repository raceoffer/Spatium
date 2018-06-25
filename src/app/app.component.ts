import {Component, NgZone, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { DeviceService } from './services/device.service';

declare const NativeStorage: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';

  constructor(private readonly ngZone: NgZone,
              private readonly device: DeviceService,
              private readonly router: Router) {

  }

  ngOnInit() {
    this.device.deviceReady().then(() => {
      NativeStorage.getItem("startPath",
        (value) => this.ngZone.run(async () => {
          await this.router.navigate([value]);
        })
      );
    });
  }
}
