import { Component, EventEmitter, HostBinding, Output } from "@angular/core";
import { FactorType } from '../../../services/auth.service';

@Component({
  selector: 'app-graphic-key-auth-factor',
  templateUrl: './graphic-key-auth-factor.component.html',
  styleUrls: ['./graphic-key-auth-factor.component.css']
})
export class GraphicKeyAuthFactorComponent {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onSubmit(graphicKey) {
    this.submit.next({
      factor: FactorType.GRAPHIC_KEY,
      value: graphicKey
    });
  }
}
