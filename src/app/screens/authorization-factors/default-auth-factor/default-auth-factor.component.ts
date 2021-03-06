import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from "../../../services/auth.service";
import { NavigationService } from "../../../services/navigation.service";
import {Router} from '@angular/router';

@Component({
  selector: 'app-default-auth-factor',
  templateUrl: './default-auth-factor.component.html',
  styleUrls: ['./default-auth-factor.component.css']
})
export class DefaultAuthFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() advanced: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelled: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private readonly navigationService: NavigationService,
    private readonly router: Router
  ) {}

  public async cancel() {
    await this.router.navigate(['/login']);
  }

  public onBack() {
    this.navigationService.back();
  }

  public onAdvanced() {
    this.advanced.next();
  }

  public onSubmit(password) {
    this.submit.next({
      type: AuthFactor.Password,
      value: Buffer.from(password, 'utf-8')
    });
  }
}
