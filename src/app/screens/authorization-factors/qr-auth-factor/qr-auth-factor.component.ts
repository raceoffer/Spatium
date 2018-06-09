import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { AuthFactor } from '../../../services/auth.service';
import { NavigationService } from "../../../services/navigation.service";

@Component({
  selector: 'app-qr-auth-factor',
  templateUrl: './qr-auth-factor.component.html',
  styleUrls: ['./qr-auth-factor.component.css']
})
export class QrAuthFactorComponent {
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

  public onScanned(text) {
    this.submit.next({
      type: AuthFactor.QR,
      value: Buffer.from(text, 'utf-8')
    });
  }
}
