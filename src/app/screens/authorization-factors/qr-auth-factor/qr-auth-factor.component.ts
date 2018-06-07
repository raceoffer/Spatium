import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from '../../../services/auth.service';
import { AuthFactor as AuthFactorInterface } from "../auth-factor";

@Component({
  selector: 'app-qr-auth-factor',
  templateUrl: './qr-auth-factor.component.html',
  styleUrls: ['./qr-auth-factor.component.css']
})
export class QrAuthFactorComponent implements AuthFactorInterface {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onScanned(text) {
    this.submit.next({
      type: AuthFactor.QR,
      value: Buffer.from(text, 'utf-8')
    });
  }
}
