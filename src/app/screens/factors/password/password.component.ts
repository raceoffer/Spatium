import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { FactorType } from '../../../services/auth.service';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Output() isPasswordChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  stContinue = 'Continue';
  stPassword = 'Password';

  password = '';

  constructor() { }

  ngOnInit() {
    this.password = '';
  }

  async goNext() {
    this.onSuccess.emit({factor: FactorType.PASSWORD, value: this.password});
  }

  onFocusOut() {
    this.stPassword = 'Password';
  }

  onFocus() {
    this.stPassword = '';
  }
}
