import { Component, OnInit } from '@angular/core';

declare var window;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  entry = 'Log in';
  stLogin = 'Username';
  login = '';
  isDisable = false;

  constructor() { }

  ngOnInit() {
  }


  letLogin(): void {
    this.isDisable = !this.isDisable;
    this.isEthernetAvailable();
  }

  isEthernetAvailable(): void {
    window.plugins.toast.showLongBottom('No connection', 3000, 'No connection', console.log('No connection'));
    this.isDisable = !this.isDisable;
  }
}
