import { Component, OnInit } from '@angular/core';

declare var cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  message = 'Loading...';
  platform = cordova.platformId;

  ngOnInit() {
  	document.addEventListener("deviceready", () => {
      console.log('Using Cordova plugins with Angular. Cordova version: ' + cordova.platformVersion)
    }, false);

    cordova.plugins.bluetooth.coolMethod();
  }

}
