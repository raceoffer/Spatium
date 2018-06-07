import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from '../../../services/auth.service';
import { AuthFactor as AuthFactorInterface } from "../auth-factor";

@Component({
  selector: 'app-password-auth-factor',
  templateUrl: './password-auth-factor.component.html',
  styleUrls: ['./password-auth-factor.component.css']
})
export class PasswordAuthFactorComponent implements AuthFactorInterface {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onSubmit(password) {
    this.submit.next({
      type: AuthFactor.Password,
      value: Buffer.from(password, 'utf-8')
    });
  }
}
