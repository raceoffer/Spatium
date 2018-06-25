import { Component, OnInit } from '@angular/core';

declare const navigator: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';
  time = 180000;
  timer = setTimeout(() => {
    navigator.app.exitApp();
  }, this.time);

  constructor() { }

  ngOnInit() {}

  timerUpdate() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      navigator.app.exitApp();
    }, this.time);
  }
}
