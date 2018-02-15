import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'app-main-drawer',
  templateUrl: './main-drawer.component.html',
  styleUrls: ['./main-drawer.component.css']
})
export class MainDrawerComponent implements OnInit {
  @Input() navLinks: Array<any> = [];
  @Output() linkClicked: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('sidenav') sidenav;

  constructor() {}

  ngOnInit() {}

  public toggle() {
    this.sidenav.toggle();
  }

  public onClicked(navLink) {
    this.linkClicked.emit(navLink);
  }
}
