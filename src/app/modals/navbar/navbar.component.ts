import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public version: any;
  @Input() navLinks: Array<any> = [];
  @Input() current: string = null;
  @Output() clicked = new EventEmitter<any>();
  @Output() closed = new EventEmitter<any>();

  constructor(private readonly ds: DeviceService) {
    this.ds.appInfo().then((info: any) => {
      this.version = info.version;
    });
  }

  public onClicked(navLink) {
    this.clicked.next(navLink);
  }

  public onClose() {
    this.closed.next();
  }
}
