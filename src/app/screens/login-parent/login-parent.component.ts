import {Component, NgZone, OnInit} from '@angular/core';
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

declare const nfc: any;

@Component({
  selector: 'app-login-parent',
  templateUrl: './login-parent.component.html',
  styleUrls: ['./login-parent.component.css']
})
export class LoginParentComponent  implements OnInit {
  contentType = Content;
  content = Content.Login;

  stateType = State;
  buttonState = State.Empty;

  stSignUp = 'Sign up';
  stLogIn = 'Log in';
  stError = 'Retry';

  input = '';

  isNfcAvailable = true;

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly dds: DDSService
  ) { }

  ngOnInit() {
    nfc.enabled(function () {
      console.log('success');
    }, function () {
      console.log('failure');
      this.ngZone.run(async () => {
        this.isNfcAvailable = false;
      });
    }.bind(this));
  }

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
      this.notification.show('No network connection');
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
      this.authService.login = this.input;
      this.authService.password = '';
      this.authService.clearFactors();

      await this.router.navigate(['/registration']);
    } else {
      // do nothing
    }
  }
}
