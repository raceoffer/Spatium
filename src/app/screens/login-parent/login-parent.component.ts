import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';

declare const Utils: any;

enum State {
  Empty,
  Exists,
  New,
  Updating,
  Error
}

enum Content {
  Login,
  QR,
  NFC
}

@Component({
  selector: 'app-login-parent',
  templateUrl: './login-parent.component.html',
  styleUrls: ['./login-parent.component.css']
})
export class LoginParentComponent {
  contentType = Content;
  content = Content.Login;

  stateType = State;
  buttonState = State.Empty;

  stSignUp = 'Sign up';
  stLogIn = 'Log in';
  stError = '';

  input = '';

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly dds: DDSService
  ) { }

  toggleContent(content) {
    this.buttonState = State.Empty;
    this.content = content;
  }

  async setBusy() {
    this.buttonState = State.Updating;
  }

  async setEmpty() {
    this.buttonState = State.Empty;
  }

  async setInput(input: string) {
    this.input = input;
    await this.checkInput(this.input);
  }

  async checkInput(input: string) {
    if (!await Utils.testNetwork()) {
      console.log('no network');
      this.stError = 'Network is unavailable';
      this.buttonState = State.Error;
      return;
    }
    try {
      this.buttonState = State.Updating;
      const exists = await this.dds.exists(AuthService.toId(input));
      if (input !== this.input) { // in case of updates to userName during lookup
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
      this.authService.login = this.input;
      this.authService.clearFactors();

      try {
        this.authService.remoteEncryptedTrees = await this.dds.read(AuthService.toId(this.input));
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
