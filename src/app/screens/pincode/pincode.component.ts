import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-pincode',
  templateUrl: './pincode.component.html',
  styleUrls: ['./pincode.component.css']
})
export class PincodeComponent implements OnInit {
  pincode='';

  constructor() { }

  ngOnInit() {
  }

  get Pincode() {
    return this.pincode;
  }

  @Input()
  set Pincode(newPin) {
    this.pincode = newPin;
  }

  onAddClicked(symbol) {
    this.pincode = this.pincode + symbol;
  }

  onBackspaceClicked() {
    this.pincode = this.pincode.substr(0, this.pincode.length-1);
  }

  onSubmitClicked() {

  }

}
