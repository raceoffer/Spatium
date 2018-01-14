import {Component, Input, OnInit} from '@angular/core';
import {Router} from "@angular/router";

declare var window;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  entry = 'Log in';
  stLogin = 'Username';
  _userNameValue = '';
  isDisable = false;

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

  letLogin(): void {
    this.isDisable = !this.isDisable;
    this.isEthernetAvailable();
  }

  isEthernetAvailable(): void {
    console.log(this._userNameValue);
    var isOnline = true;

    if (isOnline) {
      this.router.navigate(['/auth'], { queryParams: { username: this._userNameValue } });

    } else {
      window.plugins.toast.showLongBottom('No connection', 3000, 'No connection', console.log('No connection'));
      this.isDisable = !this.isDisable;
    }
  }
}
