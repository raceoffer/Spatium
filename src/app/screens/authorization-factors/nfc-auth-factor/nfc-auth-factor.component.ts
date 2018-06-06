import { Component, EventEmitter, HostBinding, Output } from '@angular/core';

import { FactorType } from '../../../services/auth.service';

@Component({
  selector: 'app-nfc-auth-factor',
  templateUrl: './nfc-auth-factor.component.html',
  styleUrls: ['./nfc-auth-factor.component.css']
})
export class NfcAuthFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onScanned(event) {
    this.submit.next({
      factor: FactorType.NFC,
      value: event.id
    });
  }
}
