import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from '../../../services/auth.service';
import { NavigationService } from "../../../services/navigation.service";

@Component({
  selector: 'app-password-auth-factor',
  templateUrl: './password-auth-factor.component.html',
  styleUrls: ['./password-auth-factor.component.css']
})
export class PasswordAuthFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();

  constructor(private readonly navigationService: NavigationService) {}

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  public onSubmit(password) {
    this.submit.next({
      type: AuthFactor.Password,
      value: Buffer.from(password, 'utf-8')
    });
  }
}
