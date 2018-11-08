import { AfterViewInit, Component, HostBinding, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { randomBytes, tryUnpackLogin } from 'crypto-core-async/lib/utils';
import { LoginComponent as LoginInput } from '../../inputs/login/login.component';
import { AuthService, IdFactor } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';
import { checkNfc, Type } from '../../utils/nfc';
import { SettingsService } from '../../services/settings.service';
import { AnalyticsService, View } from '../../services/analytics.service';

declare const cordova: any;

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
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  public contentType = IdFactor;
  public content = IdFactor.Login;

  public login = null;
  public loginType = null;

  public stateType = State;
  public buttonState = State.Empty;

  public isNfcAvailable = false;
  public isCameraAvailable = false;
  @ViewChild(LoginInput) public loginComponent: LoginInput;
  public delayed = null;
  public valid = null;
  private subscriptions = [];
  private cameraChangesCallbackId: number;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly dds: DDSService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService,
    private readonly ngZone: NgZone,
    private readonly settings: SettingsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async ngOnInit() {
    this.analyticsService.trackView(View.AuthWalletMode);

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBack();
      })
    );

    this.isNfcAvailable = await checkNfc();
    this.isCameraAvailable = await cordova.plugins.cameraInfo.isAvailable();

    this.cameraChangesCallbackId = await cordova.plugins.cameraInfo.subscribeToAvailabilityChanges(
      isCameraAvailable => this.ngZone.run(() => {
        this.isCameraAvailable = isCameraAvailable;
      })
    );
  }

  ngAfterViewInit() {
    this.delayed = this.loginComponent.delayed;
    this.valid = this.loginComponent.valid;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    cordova.plugins.cameraInfo.unsubscribeFromAvailabilityChanges(this.cameraChangesCallbackId);
  }

  toggleContent(content) {
    if (this.content !== content) {
      this.buttonState = State.Empty;
      this.content = content;

      this.loginType = null;
      this.login = null;
    }
  }

  async onInput(type: IdFactor, input: any) {
    let login = null;
    switch (type) {
      case IdFactor.Login:
        if (this.valid.getValue()) {
          login = input;
        }
        break;
      case IdFactor.QR:
        let bytes = null;
        try {
          bytes = Buffer.from(input, 'hex');
        } catch (e) {
        }
        if (input && bytes) {
          login = await tryUnpackLogin(bytes, this.workerService.worker);
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
    try {
      this.buttonState = State.Updating;
      const id = await this.authService.toId(type === IdFactor.Login ? login.toLowerCase() : login);
      const exists = await this.dds.exists(id);

      if (exists) {
        this.buttonState = State.Exists;
      } else if (type === IdFactor.Login) {
        this.buttonState = State.New;
      } else {
        this.buttonState = State.Empty;
        this.notification.show('A Spatium identifier was not found in the storage. Please, sign in with login');
      }
    } catch (e) {
      this.notification.show('The storage is unavailable');
      this.buttonState = State.Error;
    }
  }

  async signUp() {
    await this.router.navigate(['/registration', this.login]);
  }

  async signIn() {
    await this.router.navigate(['/auth', this.loginType, this.login]);
  }

  async onBack() {
    try {
      await this.settings.setStartPath(null);
    } catch (e) {
      console.log(e);
    }
    await this.router.navigate(['/start']);
  }
}
