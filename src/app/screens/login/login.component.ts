import { Component, AfterViewInit, Output, EventEmitter, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';

declare const CryptoCore: any;
declare const nfc: any;

enum State {
  Ready,
  Updating,
  Exists,
  Error
}

@Component({
  selector: 'app-login',
  host: {'class': 'child content text-center'},
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  private _userName = '';

  stLogin = 'Username';

  stateType = State;
  usernameState = State.Ready;

  @Input() genericLogin: string;

  timer;

  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() buisyEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();

  get userName() {
    return this._userName;
  }

  set userName(newUserName) {
    this._userName = newUserName;
    if (this._userName.length > 0) {
      this.buisyEvent.emit();
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.inputEvent.emit(this._userName);
      }, 1000);
    } else {
      this.clearEvent.emit();
      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
  }

  constructor(private readonly dds: DDSService,
              private readonly authSevice: AuthService,
              private readonly notification: NotificationService) { }

  ngAfterViewInit() {
    if (this.genericLogin !== null) {
      this.userName = this.genericLogin;
      this.genericLogin = null;
    } else {
      this.userName = '';
    }
  }

  async generateNewLogin() {
    if (!await CryptoCore.Utils.testNetwork()) {
      this.notification.show('No network connection');
      this.usernameState = State.Error;
      return;
    }
    this.usernameState = State.Updating;
    try {
      do {
        this.userName = this.authSevice.makeNewLogin(10);
        const exists = await this.dds.exists(AuthService.toId(this._userName));
        if (!exists) {
          this.notification.show('Unique login was generated');
          this.usernameState = State.Ready;
          break;
        }
      } while (true);
    } catch (ignored) {
      this.usernameState = State.Error;
    }
  }
}
