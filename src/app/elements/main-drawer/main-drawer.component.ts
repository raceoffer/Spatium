import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main-drawer',
  templateUrl: './main-drawer.component.html',
  styleUrls: ['./main-drawer.component.css']
})
export class MainDrawerComponent {
  @Input() navLinks: Array<any> = [];
  @Input() current: string = null;
  @Output() closeClicked: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('sidenav') sidenav;

  public toggle() {
    this.sidenav.toggle();
    this.closeClicked.emit();
  }

  public async onClicked(navLink) {
    this.toggle();
    await navLink.clicked();
  }
}
