import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from "../../../services/auth.service";
import { AuthFactor as AuthFactorInterface } from "../auth-factor";

declare const window: any;
declare const device: any;

@Component({
  selector: 'app-pincode-auth-factor',
  templateUrl: './pincode-auth-factor.component.html',
  styleUrls: ['./pincode-auth-factor.component.css']
})
export class PincodeAuthFactorComponent implements AuthFactorInterface {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onSubmit(pincode) {
    this.submit.next({
      type: AuthFactor.Pincode,
      value: Buffer.from(pincode, 'utf-8')
    });
  }
}
