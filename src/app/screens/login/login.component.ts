import {Component, AfterViewInit, Output, EventEmitter, Input} from '@angular/core';

declare const Utils: any;
declare const nfc: any;
declare const ndef: any;

@Component({
  selector: 'app-login',
  host: {'class': 'child'},
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  private _userName = '';

  stLogin = 'Username';

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

  constructor() { }

  ngAfterViewInit() {
    if (this.genericLogin !== null) {
      this.userName = this.genericLogin;
      this.genericLogin == null;
    } else {
      this.userName = '';
    }
  }

  // pust' tut polezhit
  writeTag() {
    const content = Utils.packLogin(this.userName);
    const payload = Array.from(content);
    const mimeType = 'text/pg';

    const record = ndef.mimeMediaRecord(mimeType, payload);

    nfc.write([record], function () {
      console.log('success write');
    }, function (e) {
      console.log('error write ' + JSON.stringify(e));
    });

  }
}
