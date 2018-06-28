import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from "../../../services/auth.service";
import { NavigationService } from "../../../services/navigation.service";

@Component({
  selector: 'app-pincode-auth-factor',
  templateUrl: './pincode-auth-factor.component.html',
  styleUrls: ['./pincode-auth-factor.component.css']
})
export class PincodeAuthFactorComponent{
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

  public onSubmit(pincode) {
    this.submit.next({
      type: AuthFactor.Pincode,
      value: Buffer.from(pincode, 'utf-8')
    });
  }
}
