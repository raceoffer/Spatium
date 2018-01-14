import {Component, Input, OnInit} from '@angular/core';
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
  _userNameValue = '';

  get userNameValue() {
    return this._userNameValue;
  }

  @Input()
  set userNameValue(value) {
    this._userNameValue = value;
  }

  constructor(private readonly router: Router) { }

  ngOnInit() {
  }

  async letLogin() {
      this.router.navigate(['/waiting']);

  }

  async isEthernetAvailable() {
    return await Utils.testNetwork();
  }
}
