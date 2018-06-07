import { Component, EventEmitter, HostBinding, Output } from "@angular/core";
import { AuthFactor } from '../../../services/auth.service';
import { AuthFactor as AuthFactorInterface } from "../auth-factor";

@Component({
  selector: 'app-graphic-key-auth-factor',
  templateUrl: './graphic-key-auth-factor.component.html',
  styleUrls: ['./graphic-key-auth-factor.component.css']
})
export class GraphicKeyAuthFactorComponent implements AuthFactorInterface {
  @HostBinding('class') classes = 'factor-component';

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();
  @Output() back: EventEmitter<any> = new EventEmitter<any>();

  onBack() {
    this.back.next();
  }

  onSubmit(graphicKey) {
    this.submit.next({
      type: AuthFactor.GraphicKey,
      value: Buffer.from(graphicKey, 'utf-8')
    });
  }
}
