import { Component } from '@angular/core';
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
  userName = '';

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  constructor(private readonly router: Router) { }

  async letLogin() {
    if (await LoginComponent.isEthernetAvailable()) {
      await this.router.navigate(['/auth'], { queryParams: { username: this.userName } });
    } else {
      window.plugins.toast.showLongBottom('No connection', 3000, 'No connection', console.log('No connection'));
    }
  }
}
