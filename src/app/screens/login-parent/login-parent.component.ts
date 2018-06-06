import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginType } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';

declare const cordova: any;
declare const nfc: any;

import { randomBytes } from 'crypto-core-async/lib/utils';

export enum State {
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
export class LoginParentComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public contentType = Content;
  public content = Content.Login;

  public login = '';

  stateType = State;
  buttonState = State.Empty;

  stError = 'Retry';

  recognitionMsg = '';
  input = '';
  isNfcAvailable = true;
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
        await this.onBack();
      })
    );

    nfc.enabled(function () {}, function (e) {
      if (e === 'NO_NFC' || e === 'NO_NFC_OR_NFC_DISABLED') {
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
    this.login = '';
    this.content = content;
  }

  async onLogin(login) {
    if (!login) {
      this.buttonState = State.Empty;
      return;
    }

    try {
      this.buttonState = State.Updating;

      const exists = await this.dds.exists(await this.authService.toId(login.toLowerCase()));

      this.login = login;

      if (exists) {
        this.buttonState = State.Exists;
      } else {
        this.buttonState = State.New;
      }
    } catch(e) {
      this.buttonState = State.Error;
    }
  }

  onBusy(busy) {
    if (busy) {
      this.buttonState = State.Updating;
    }
  }

  async signUp() {
    console.log('signUp', this.login);
  }

  async signIn() {
    console.log('signIn', this.login);
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

  async onBack() {
    await this.router.navigate(['/start']);
  }
}
