import { Component, EventEmitter, Input, Output } from '@angular/core';
import { findParentElement, isElementDisabled } from '../../utils/dom';

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent {
  @Input() busy = false;
  @Input() allowFingerprint = false;

  @Output() fingerpintRequested: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  public pincode: string = '';

  onAdd(symbol) {
    this.pincode = this.pincode + symbol;
  }

  onBackspace() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
  }

  onClear(event = null) {
    if (event) {
      const element = findParentElement(event.target, 'button', true);
      if (isElementDisabled(element)) {
        console.log('button disabled: prevent onClear');
        return;
      }
    }
    this.pincode = '';
  }

  onFinger() {
    this.fingerpintRequested.next();
  }

  onSubmit() {
    this.submit.next(this.pincode);
  }
}
