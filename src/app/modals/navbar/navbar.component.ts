import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() navLinks: Array<any> = [];
  @Input() current: string = null;

  @Output() clicked = new EventEmitter<any>();
  @Output() closed = new EventEmitter<any>();

  public onClicked(navLink) {
    this.clicked.next(navLink);
  }

  public onClose() {
    this.closed.next();
  }
}
