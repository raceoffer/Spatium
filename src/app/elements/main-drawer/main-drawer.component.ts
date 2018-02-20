import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main-drawer',
  templateUrl: './main-drawer.component.html',
  styleUrls: ['./main-drawer.component.css']
})
export class MainDrawerComponent implements OnInit {
  @Input() navLinks: Array<any> = [];
  @Output() linkClicked: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeClicked: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('sidenav') sidenav;

  constructor() {}

  ngOnInit() {}

  public toggle() {
    this.sidenav.toggle();
    this.closeClicked.emit();
  }

  public onClicked(navLink) {
    this.toggle();
    this.linkClicked.emit(navLink);
  }
}
