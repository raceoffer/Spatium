import { Component, OnInit } from '@angular/core';

declare var cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  platform = cordova.platformId;
  message = this.platform;

  ngOnInit() {
  	document.addEventListener("deviceready", () => {
      cordova.plugins.bluetooth.getDeviceInfo(
        arg => {
          console.log(arg);
          this.message = arg;
        },
        err => {
          console.log(err);
          this.message = err;
        }
      );
      //console.log('Using Cordova plugins with Angular. Cordova version: ' + cordova.platformVersion)
    }, false);
  }

}
