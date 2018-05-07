import {Component, Output, EventEmitter, Input, HostBinding, AfterViewInit} from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FactorType } from '../../../services/auth.service';
import { DDSService } from '../../../services/dds.service';
import { NotificationService } from '../../../services/notification.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare const CryptoCore: any;

enum State {
  Ready,
  Updating,
  Exists,
  Error
}

@Component({
  selector: 'app-login-factor',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {

  @HostBinding('class') classes = 'content factor-content text-center';
  private _userName = '';

  stLogin = 'Login';
  uploading = false;

  stateType = State;
  usernameState = State.Ready;

  timer;

  @Input() genericLogin: string;
  @Input() isExport = false;
  @Input() isAuth = false;
  @Input() secretValue = '';
  value: BehaviorSubject<string> = null;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();
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

  constructor(
    private readonly dds: DDSService,
    private readonly authService: AuthService,
    private readonly notification: NotificationService
  ) { }

  ngAfterViewInit() {
    this.userName = '';
  }

  async generateNewLogin() {
    this.usernameState = State.Updating;
    try {
      do {
        this.userName = this.authService.makeNewLogin(10);
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
    this.stLogin = 'Login';
  }

  onFocus() {
    this.stLogin = '';
  }

  async onNext() {
    this.onSuccess.emit({factor: FactorType.LOGIN, value: this.userName});
  }
}
