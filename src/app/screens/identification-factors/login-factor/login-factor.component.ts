import {Component, Output, EventEmitter, HostBinding } from '@angular/core';
import { NavigationService } from "../../../services/navigation.service";
import { IdFactor } from "../../../services/auth.service";

@Component({
  selector: 'app-login-factor',
  templateUrl: './login-factor.component.html',
  styleUrls: ['./login-factor.component.css']
})
export class LoginFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  public busy = false;
  public input = '';

  constructor(private readonly navigationService: NavigationService) {}

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
  }

  public onBusy(busy) {
    this.busy = busy;
  }

  public onInput(login) {
    this.input = login;
  }

  public onSubmit() {
    this.submit.next({
      type: IdFactor.Login,
      value: this.input
    });
  }
}
