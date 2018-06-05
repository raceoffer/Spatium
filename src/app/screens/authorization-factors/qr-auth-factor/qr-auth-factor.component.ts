import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { FactorType } from '../../../services/auth.service';

@Component({
  selector: 'app-qr-auth-factor',
  templateUrl: './qr-auth-factor.component.html',
  styleUrls: ['./qr-auth-factor.component.css']
})
export class QrAuthFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onScanned(text) {
    this.submit.next({
      factor: FactorType.QR,
      value: text
    });
  }
}
