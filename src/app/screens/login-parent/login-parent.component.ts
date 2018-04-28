import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginType } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';

declare const CryptoCore: any;
declare const cordova: any;
declare const device: any;

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
export class LoginParentComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  contentType = Content;
  content = Content.Login;
  stateType = State;
  buttonState = State.Empty;
  stSignUp = 'Sign up';
  stLogIn = 'Sign in';
  stError = 'Retry';
  notRecognized = 'hide';
  loginGenerate = null;
  input = '';
  isNfcAvailable = true;
  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly ngZone: NgZone,
              private readonly authService: AuthService,
              private readonly notification: NotificationService,
              private readonly keychain: KeyChainService,
              private readonly dds: DDSService,
              private readonly navigationService: NavigationService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    nfc.enabled(function () {}, function (e) {
      if (e === 'NO_NFC' || (this.isWindows() && e === 'NO_NFC_OR_NFC_DISABLED')) {
        this.ngZone.run(async () => {
          this.isNfcAvailable = false;
        });
      }
    }.bind(this));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  toggleContent(content) {
    this.buttonState = State.Empty;
    this.content = content;
    this.notRecognized = 'hide';
    if (this.loginGenerate && content === this.contentType.Login) {
      console.log(this.loginGenerate);
    } else {
      this.loginGenerate = null;
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
    try {
      this.buttonState = State.Updating;
      const exists = await this.dds.exists(await AuthService.toId(input));
      if (input !== this.input) { // in case of updates to userName during lookup
        return;
      }
      if (exists) {
        this.buttonState = State.Exists;
      } else {
        if (this.content === this.contentType.QR || this.content === this.contentType.NFC) {
          await this.generate();
        } else {
          this.buttonState = State.New;
        }
      }
    } catch (ignored) {
      if (this.content === this.contentType.QR || this.content === this.contentType.NFC) {
        await this.generate();
      } else {
        this.notification.show('No network connection');
        this.buttonState = State.Error;
      }
    }
  }

  async generate() {
    this.notRecognized = '';
    this.buttonState = State.Empty;
    do {
      this.loginGenerate = this.authService.makeNewLogin(10);
      if (!await this.dds.exists(await AuthService.toId(this.loginGenerate))) {
        break;
      }
    } while (true);
  }

  async letLogin() {
    switch (this.content) {
      case this.contentType.Login: {
        this.authService.loginType = LoginType.LOGIN;
        this.authService.isPasswordFirst = false;
        break;
      }
      case this.contentType.NFC: {
        this.authService.loginType = LoginType.NFC;
        this.authService.isPasswordFirst = true;
        break;
      }
      case this.contentType.QR: {
        this.authService.loginType = LoginType.QR;
        this.authService.isPasswordFirst = true;
        break;
      }
    }

    if (this.buttonState === State.Exists) {
      this.authService.login = this.input;
      this.authService.clearFactors();

      try {
        this.authService.remoteEncryptedTrees = [];
        this.authService.remoteEncryptedTrees.push(await this.dds.read(await AuthService.toId(this.input)));
      } catch (e) {
        this.notification.show('No backup found');
      }

      await this.router.navigate(['/auth']);
    } else if (this.buttonState === State.New) {
      this.authService.login = this.input;
      this.authService.password = '';
      this.authService.clearFactors();
      this.keychain.setSeed(await CryptoCore.Utils.randomBytes(64));

      await this.router.navigate(['/registration']);
    } else {
      // do nothing
    }
  }

  async onBackClicked() {
    await this.router.navigate(['/start']);
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }
}
