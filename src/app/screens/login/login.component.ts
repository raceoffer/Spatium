import {Component, Input} from '@angular/core';
import { Router } from '@angular/router';

declare const window: any;
declare const Utils: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  entry = 'Log in';
  stLogin = 'Username';
  _userName = '';
  isDisable = true;

  ngAfterViewInit() {
    this._userName = '';
  }

  get UserName() {
    return this._userName;
  }

  @Input()
  set UserName(newUserName) {
    this._userName = newUserName;
    if (this._userName.length > 1){
      this.isDisable = false;
      console.log(this.isDisable);
    } else {
      this.isDisable = true;
      console.log(this.isDisable);
    }
  }

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  constructor(private readonly router: Router) { }

  async letLogin() {
    if(this._userName != '') {
      if (await LoginComponent.isEthernetAvailable()) {
        await this.router.navigate(['/auth'], {queryParams: {username: this._userName}});
      } else {
        window.plugins.toast.showLongBottom('No connection', 3000, 'No connection', console.log('No connection'));
      }
    }
  }
}
