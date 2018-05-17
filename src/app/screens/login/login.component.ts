import {
  AfterViewInit, Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChange,
  SimpleChanges
} from '@angular/core';
import { State } from '../login-parent/login-parent.component';

declare const nfc: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit, OnChanges {
  @HostBinding('class') classes = 'full-width_nopadding';
  stLogin = 'Username';
  stateType = State;
  @Input() genericLogin: string;
  @Input() usernameState: State;
  timer;
  @Output() clearEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() buisyEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() inputEvent: EventEmitter<string> = new EventEmitter<string>();
  @Output() generateEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  private _userName = '';

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

  ngOnChanges(changes: SimpleChanges) {
    const genericLogin: SimpleChange = changes.genericLogin;
    if (genericLogin.currentValue !== null) {
      this.userName = genericLogin.currentValue;
    }
  }

  ngAfterViewInit() {
    if (this.genericLogin !== null) {
      this.userName = this.genericLogin;
      this.genericLogin = null;
    } else {
      this.userName = '';
    }
  }

  async generateNewLogin() {
    this.generateEvent.emit();
  }

  onFocusOut() {
    this.stLogin = 'Username';
  }

  onFocus() {
    this.stLogin = '';
  }
}
