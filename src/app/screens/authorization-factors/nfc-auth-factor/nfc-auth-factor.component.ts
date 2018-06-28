import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from '../../../services/auth.service';
import { NavigationService } from "../../../services/navigation.service";

@Component({
  selector: 'app-nfc-auth-factor',
  templateUrl: './nfc-auth-factor.component.html',
  styleUrls: ['./nfc-auth-factor.component.css']
})
export class NfcAuthFactorComponent {
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

  public onScanned(event) {
    this.submit.next({
      type: AuthFactor.NFC,
      value: new Buffer(event.id)
    });
  }
}
