import { Component, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main-drawer',
  templateUrl: './main-drawer.component.html',
  styleUrls: ['./main-drawer.component.css']
})
export class MainDrawerComponent {
  @Input() navLinks: Array<any> = [];
  @Input() current: string = null;

  @ViewChild('sidenav') sidenav;

  public toggle() {
    this.sidenav.toggle();
  }

  public async onClicked(navLink) {
    this.toggle();
    await navLink.clicked();
  }
}
