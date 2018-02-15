import {Component, NgZone, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';

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
  stLogIn = 'Sign in';
  stError = 'Retry';

  notRecognized = 'hide';
  qrGenerate = null;

  input = '';

  isNfcAvailable = true;

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService,
    private readonly dds: DDSService
  ) { }

  ngOnInit() {
    nfc.enabled(function () {}, function (e) {
      if (e === 'NO_NFC') {
        this.ngZone.run(async () => {
          this.isNfcAvailable = false;
        });
      }
    }.bind(this));
  }

  toggleContent(content) {
    this.buttonState = State.Empty;
    this.content = content;
    this.notRecognized = 'hide';
    if (this.qrGenerate && content === this.contentType.Login) {
      console.log(this.qrGenerate);
    } else {
      this.qrGenerate = null;
    }
  }

  async setBusy() {
    this.buttonState = State.Updating;
  }

  async setEmpty() {
    this.buttonState = State.Empty;
    this.notRecognized = 'hide';
  }

  async setInput(input: string) {
    this.input = input;
    await this.checkInput(this.input);
  }

  async checkInput(input: string) {
    /*if (!await Utils.testNetwork()) {
      this.notification.show('No network connection');
      this.buttonState = State.Error;
      return;
    }*/
    try {
      this.buttonState = State.Updating;
      const exists = await this.dds.exists(AuthService.toId(input));
      if (input !== this.input) { // in case of updates to userName during lookup
        return;
      }
      if (exists) {
        this.buttonState = State.Exists;
      } else {
        if (this.content === this.contentType.NFC) {
          this.notRecognized = '';
          this.buttonState = State.Empty;
          do {
            this.qrGenerate = this.authService.makeNewLogin(10);
            const exists = await this.dds.exists(AuthService.toId(this.qrGenerate));
            if (!exists) {
              break;
            }
          } while (true);

        } else {
          this.buttonState = State.New;
        }
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
        this.authService.remoteEncryptedTrees = [];
        this.authService.remoteEncryptedTrees.push(await this.dds.read(AuthService.toId(this.input)));
      } catch (e) {
        this.notification.show('No backup found');
      }

      await this.router.navigate(['/auth']);
    } else if (this.buttonState === State.New) {
      this.authService.login = this.input;
      this.authService.password = '';
      this.authService.clearFactors();
      this.keychain.seed = Utils.randomBytes(64);

      await this.router.navigate(['/registration']);
    } else {
      // do nothing
    }
  }
}
