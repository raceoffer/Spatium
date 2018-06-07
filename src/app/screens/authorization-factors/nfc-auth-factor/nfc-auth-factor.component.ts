import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor as AuthFactorInterface } from "../auth-factor";

import { AuthFactor } from '../../../services/auth.service';

@Component({
  selector: 'app-nfc-auth-factor',
  templateUrl: './nfc-auth-factor.component.html',
  styleUrls: ['./nfc-auth-factor.component.css']
})
export class NfcAuthFactorComponent implements AuthFactorInterface {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onScanned(event) {
    this.submit.next({
      type: AuthFactor.NFC,
      value: new Buffer(event.id)
    });
  }
}
