import { Component, EventEmitter, HostBinding, Output } from "@angular/core";
import { AuthFactor } from '../../../services/auth.service';
import { NavigationService } from "../../../services/navigation.service";

@Component({
  selector: 'app-graphic-key-auth-factor',
  templateUrl: './graphic-key-auth-factor.component.html',
  styleUrls: ['./graphic-key-auth-factor.component.css']
})
export class GraphicKeyAuthFactorComponent {
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

  public onSubmit(graphicKey) {
    this.submit.next({
      type: AuthFactor.GraphicKey,
      value: Buffer.from(graphicKey, 'utf-8')
    });
  }
}
