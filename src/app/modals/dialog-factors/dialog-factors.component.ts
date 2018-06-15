import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dialog-factors',
  templateUrl: './dialog-factors.component.html',
  styleUrls: ['./dialog-factors.component.css']
})
export class DialogFactorsComponent {
  @Input() public factors = [];
  @Output() public selected = new EventEmitter<any>();

  constructor() {}

  onSelected(factor) {
    this.selected.next(factor.type);
  }
}
