import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { FactorType } from '../../../services/auth.service';

@Component({
  selector: 'app-password-auth-factor',
  templateUrl: './password-auth-factor.component.html',
  styleUrls: ['./password-auth-factor.component.css']
})
export class PasswordAuthFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onSubmit(password) {
    this.submit.next({
      factor: FactorType.PASSWORD,
      value: password
    });
  }
}
