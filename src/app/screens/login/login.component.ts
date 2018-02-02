import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';

declare const Utils: any;
declare const Buffer: any;

enum State {
  Empty,
  Exists,
  New,
  Updating,
  Error
}

@Component({
  selector: 'app-login',
  host: {'class': 'child'},
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  private _userName = '';

  stSignUp = 'Sign up';
  stLogIn = 'Log in';
  stLogin = 'Username';
  stNoNetwork = 'Network is unavailable';

  timer;

  stateType = State;
  buttonState = State.Empty;

  get userName() {
    return this._userName;
  }

  set userName(newUserName) {
    this._userName = newUserName;
    if (this._userName.length > 0) {
      this.buttonState = State.Updating;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.checkLogin();
      }, 1000);
    } else {
      this.buttonState = State.Empty;
      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly dds: DDSService
  ) { }

  ngAfterViewInit() {
    this.userName = '';
  }

  async checkLogin() {
    if (!await Utils.testNetwork()) {
      console.log('no network');
      this.buttonState = State.Error;
      return;
    }
    try {
      const userName = this.userName;
      const exists = await this.dds.exists(AuthService.toId(userName));
      if (userName !== this.userName) { // in case of updates to userName during lookup
        return;
      }
      if (exists) {
        this.buttonState = State.Exists;
      } else {
        this.buttonState = State.New;
      }
    } catch (ignored) {
      this.buttonState = State.Error;
    }
  }

  async letLogin() {
    if (this.buttonState === State.Exists) {
      this.authService.login = this.userName;
      this.authService.clearFactors();

      try {
        this.authService.remoteEncryptedTrees = await this.dds.read(AuthService.toId(this.userName));
      } catch (e) {
        this.authService.remoteEncryptedTrees = [];
        this.notification.show('No backup found');
      }

      await this.router.navigate(['/auth']);
    } else if (this.buttonState === State.New) {
      // not yet
    } else {
      // do nothing
    }
  }
}
