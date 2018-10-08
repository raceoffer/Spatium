import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-connected-device',
  templateUrl: './connected-device.component.html',
  styleUrls: ['./connected-device.component.scss']
})
export class ConnectedDeviceComponent implements OnInit {

  @Input() sessions: BehaviorSubject<any>;

  constructor() { }

  ngOnInit() {
  }

}
