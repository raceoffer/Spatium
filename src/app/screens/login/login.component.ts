import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';

declare const window: any;
declare const Utils: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  entry = 'Log in';
  stLogin = 'Username';
  login = '';

  constructor(private router: Router,
              private ngZone: NgZone) { }

  ngOnInit() {}

  async letLogin() {
    if (!await this.isEthernetAvailable()) {
      window.plugins.toast.showLongBottom('No connection', 3000, 'No connection', console.log('No connection'));
      return;
    }

    this.router.navigate([['/initiator-auth', { login: this.login }]]);
  }

  async isEthernetAvailable() {
    return await Utils.testNetwork();
  }
}
