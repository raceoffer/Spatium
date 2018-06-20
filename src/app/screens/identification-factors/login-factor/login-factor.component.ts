import { Component, Output, EventEmitter, HostBinding, ViewChild, AfterViewInit } from '@angular/core';
import { NavigationService } from "../../../services/navigation.service";
import { IdFactor } from "../../../services/auth.service";
import { LoginComponent } from "../../../inputs/login/login.component";

@Component({
  selector: 'app-login-factor',
  templateUrl: './login-factor.component.html',
  styleUrls: ['./login-factor.component.css']
})
export class LoginFactorComponent implements AfterViewInit {
  @HostBinding('class') classes = 'factor-component';

  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild(LoginComponent) public loginComponent: LoginComponent;

  public delayed = null;
  public generating = null;
  public valid = null;

  public input = '';

  constructor(private readonly navigationService: NavigationService) {}

  ngAfterViewInit() {
    this.delayed = this.loginComponent.delayed;
    this.generating = this.loginComponent.generating;
    this.valid = this.loginComponent.valid;
  }

  public cancel() {
    this.cancelled.next();
  }

  public onBack() {
    this.navigationService.back();
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
