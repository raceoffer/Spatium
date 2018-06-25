import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent {
  @Input() busy = false;
  @Input() allowFingerprint = false;

  @Output() fingerprintRequested: EventEmitter<any> = new EventEmitter<any>();
  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  public pincode: string = '';

  onAdd(symbol) {
    this.pincode = this.pincode + symbol;
  }

  onBackspace() {
    this.pincode = this.pincode.substr(0, this.pincode.length - 1);
  }

  onClear() {
    this.pincode = '';
  }

  onFinger() {
    this.fingerprintRequested.next();
  }

  onSubmit() {
    this.submit.next(this.pincode);
  }
}
