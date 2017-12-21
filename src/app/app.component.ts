import { Component, OnInit } from '@angular/core';

//declare var cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';

  //platform = cordova.platformId;


  constructor() { }

  ngOnInit() {
    /*
  	this.message = cordova.platformVersion;
  	document.addEventListener("deviceready", () => {
      console.log('Using Cordova plugins with Angular. Cordova version: ' + cordova.platformVersion)
    }, false)*/
  }

}
