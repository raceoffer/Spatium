import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, IdFactor } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';

declare const cordova: any;
declare const nfc: any;

import { randomBytes, tryUnpackLogin } from 'crypto-core-async/lib/utils';
import { Type } from "../../inputs/nfc-reader/nfc-reader.component";

export enum State {
  Empty,
  Exists,
  New,
  Updating,
  Error
}

@Component({
  selector: 'app-login-screen',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public contentType = IdFactor;
  public content = IdFactor.Login;

  public login = null;
  public loginType = null;

  public stateType = State;
  public buttonState = State.Empty;

  public isNfcAvailable = true;

  private subscriptions = [];

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly dds: DDSService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) {}

  async ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBack();
      })
    );

    this.isNfcAvailable = await new Promise<boolean>((resolve, reject) => nfc.enabled(
      () => resolve(true),
      e => {
        if (e === 'NO_NFC' || e === 'NO_NFC_OR_NFC_DISABLED') {
          resolve(false);
        } else {
          resolve(true);
        }
      }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  toggleContent(content) {
    this.buttonState = State.Empty;
    this.content = content;

    this.loginType = null;
    this.login = null;
  }

  async onInput(type: IdFactor, input: any) {
    let login = null;
    switch (type) {
      case IdFactor.Login:
        login = input;
        break;
      case IdFactor.QR:
        let bytes = null;
        try {
          bytes = Buffer.from(input, 'hex');
        } catch (e) {}
        if (input && bytes) {
          login = await tryUnpackLogin(Buffer.from(input, 'hex'), this.workerService.worker);
        }
        break;
      case IdFactor.NFC:
        if (input && input.type === Type.MIME) {
          login = await tryUnpackLogin(input.payload, this.workerService.worker);
        }
        break;
    }

    if (!login) {
      this.buttonState = State.Empty;
      if (type !== IdFactor.Login) {
        this.notification.show('Failed to extract a Spatium identifier');
      }
      return;
    }

    this.loginType = type;
    this.login = login;

    await this.checkLogin(type, login);
  }

  async retry() {
    await this.checkLogin(this.loginType, this.login);
  }

  async checkLogin(type: IdFactor, login: string) {
    const id = await this.authService.toId(type === IdFactor.Login ? login.toLowerCase() : login);

    try {
      this.buttonState = State.Updating;

      const exists = await this.dds.exists(id);

      if (exists) {
        this.buttonState = State.Exists;
      } else if (type === IdFactor.Login){
        this.buttonState = State.New;
      } else {
        this.buttonState = State.Empty;
        this.notification.show('A Spatium identifier was not found in the storage. Please, sign in with login');
      }
    } catch(e) {
      this.notification.show('The storage is unavailable');
      this.buttonState = State.Error;
    }
  }

  onBusy(busy) {
    if (busy) {
      this.buttonState = State.Updating;
    }
  }

  async signUp() {
    // this.keychain.setSeed(await randomBytes(64, this.workerService.worker));
    await this.router.navigate(['/registration', this.login]);
  }

  async signIn() {
    await this.router.navigate(['/auth', this.loginType, this.login]);
  }

  async onBack() {
    await this.router.navigate(['/start']);
  }
}
