import { Component, AfterViewInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-login',
  host: {'class': 'child'},
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  private _userName = '';

  stLogin = 'Username';

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
    this.userName = '';
  }
}
