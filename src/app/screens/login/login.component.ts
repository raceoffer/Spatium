import {Component, AfterViewInit, Output, EventEmitter, Input, HostBinding} from '@angular/core';
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  @HostBinding('class') classes = 'full-width_nopadding';
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

  // Hide the keyboard after pressing the submit button on the keyboard
  removeFocus(el) { el.target.blur(); }

  constructor(
    private readonly dds: DDSService,
    private readonly authSevice: AuthService,
    private readonly notification: NotificationService
  ) { }

  ngAfterViewInit() {
    if (this.genericLogin !== null) {
      this.userName = this.genericLogin;
      this.genericLogin = null;
    } else {
      this.userName = '';
    }
  }

  async generateNewLogin() {
    this.usernameState = State.Updating;
    try {
      do {
        this.userName = this.authSevice.makeNewLogin(10);
        const exists = await this.dds.exists(await AuthService.toId(this._userName));
        if (!exists) {
          this.notification.show('Unique login was generated');
          this.usernameState = State.Ready;
          break;
        }
      } while (true);
    } catch (ignored) {
      this.notification.show('No network connection');
      this.usernameState = State.Error;
    }
  }

  onFocusOut() {
    this.stLogin = 'Username';
  }

  onFocus() {
    this.stLogin = '';
  }
}
