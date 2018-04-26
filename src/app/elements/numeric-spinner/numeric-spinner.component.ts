import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-numeric-spinner',
  templateUrl: './numeric-spinner.component.html',
  styleUrls: ['./numeric-spinner.component.css']
})
export class NumericSpinnerComponent implements OnInit {
  @Input() value = 0;
  @Input() outerDiameter = 100;
  @Input() innerDiameter = 80;

  constructor() { }

  ngOnInit() { }
}
