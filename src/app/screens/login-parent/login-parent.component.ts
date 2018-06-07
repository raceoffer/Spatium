import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginType } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';

declare const cordova: any;
declare const device: any;

import { randomBytes } from 'crypto-core-async/lib/utils';

export enum State {
  Ready,
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
  isScanInProgress = false;
  contentType = Content;
  content = Content.Login;
  stateType = State;
  buttonState = State.Empty;
  usernameState = State.Ready;
  stSignUp = 'Sign up';
  stLogIn = 'Sign in';
  stError = 'Retry';
  recognitionMsg = '';
  loginGenerate = null;
  input = '';
  isNfcAvailable = true;
  isGeneric = false;
  loginGeneratedSuccessTimer: NodeJS.Timer = null;
  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService,
    private readonly dds: DDSService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) {}

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
    this.recognitionMsg = '';
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
    this.ngZone.run(async () => {
      this.buttonState = State.Empty;
      this.recognitionMsg = '';
    });
  }

  async setInput(input: string) {
    this.input = input;
    await this.checkInput(this.input);
  }

  async setIsScanInProgress() {
    this.isScanInProgress = true;
  }

  async checkInput(input: string) {
    if (!this.isGeneric) {
      if (!input || input === '' || (this.content === this.contentType.Login && this.hasSpaces(input))) {
        this.recognitionMsg = 'Incorrect login format.';
        return;
      } else {
        this.recognitionMsg = '';
      }

      try {
        this.ngZone.run(async () => {
          this.buttonState = State.Updating;
        });

        let inputForId = this.input;
        if (this.content === this.contentType.Login) {
          inputForId = inputForId.toLowerCase();
        }
        const exists = await this.dds.exists(await this.authService.toId(inputForId));
        console.log(`LoginParentComponent.checkInput: input=${input}, this.input=${this.input}, inputForId=${inputForId}, exists=${exists}`);
        if (input !== this.input) { // in case of updates to userName during lookup
          return;
        }
        if (exists) {
          this.ngZone.run(async () => {
            this.buttonState = State.Exists;
          });

        } else {
          if (this.content === this.contentType.QR || this.content === this.contentType.NFC) {
            this.recognitionMsg = 'Login does not exist. Please register.';
            await this.generateNewLogin();
          } else {
            this.ngZone.run(async () => {
              this.buttonState = State.New;
            });
          }
        }
      } catch (ignored) {
        this.notification.show('DDS is unavailable');
        this.ngZone.run(async () => {
          this.buttonState = State.Error;
        });

      }
    } else {
      console.log('generic');
    }
  }

  async generateNewLogin() {
    if (this.loginGeneratedSuccessTimer) {
      clearTimeout(this.loginGeneratedSuccessTimer);
      this.loginGeneratedSuccessTimer = null;
    } else {
      this.ngZone.run(async () => {
        this.buttonState = State.Updating;
        this.usernameState = State.Updating;
      });
    }

    this.isGeneric = true;

    try {
      this.loginGenerate = await this.generateUniqueLogin();
      if (this.loginGeneratedSuccessTimer) {
        return;
      }

      this.loginGeneratedSuccessTimer = setTimeout(() => {
        this.ngZone.run(async () => {
          this.usernameState = State.Ready;
          this.notification.show('Unique login was generated');
          this.loginGeneratedSuccessTimer = null;
        });
      }, 1000);
    } catch (ignored) {
      console.log(ignored);
      this.notification.show('DDS is unavailable');
      this.ngZone.run(async () => {
        this.usernameState = State.Error;
        this.buttonState = State.Error;
      });
    }
    this.isGeneric = false;
  }

  async generateUniqueLogin(): Promise<string> {
    do {
      const login: string = this.authService.makeNewLogin(10);
      const exists: boolean = await this.dds.exists(await this.authService.toId(login.toLowerCase()));
      if (!exists) {
        return login;
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

    this.authService.reset();
    this.authService.clearFactors();

    if (this.buttonState === State.Exists) {
      this.authService.login = this.input;

      try {
        // Let it spin a bit more
        this.buttonState = State.Updating;
        this.authService.remoteEncryptedTrees = [];
        let inputForId = this.input;
        if (this.content === this.contentType.Login) {
          inputForId = inputForId.toLowerCase();
        }
        this.authService.remoteEncryptedTrees.push(await this.dds.read(await this.authService.toId(inputForId)));
        console.log(`LoginParentComponent.letLogin: this.input=${this.input}, inputForId=${inputForId}`);
      } catch (e) {
        this.notification.show('No backup found');
      } finally {
        this.buttonState = State.Exists;
      }

      await this.router.navigate(['/auth']);
    } else if (this.buttonState === State.New) {
      this.authService.login = this.input;
      this.authService.password = '';
      this.keychain.setSeed(await randomBytes(64, this.workerService.worker));

      await this.router.navigate(['/registration']);
    } else {
      // do nothing
    }
  }

  async onBackClicked() {
    if (this.isScanInProgress) {
      this.isScanInProgress = false;
      this.setEmpty();
      return;
    }

    await this.router.navigate(['/start']);
  }

  isWindows(): boolean {
    return device.platform === 'windows';
  }

  hasSpaces(v: string): boolean {
    return !!v.match(/\s/);
  }
}
