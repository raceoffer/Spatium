import { Component, OnInit } from '@angular/core';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-finger-print',
  templateUrl: './finger-print.component.html',
  styleUrls: ['./finger-print.component.css']
})
export class FingerPrintComponent implements OnInit {

  stFinger = 'Touch the sensor';
  fingerClass = 'color-cool_grey icon-60';
  stToastErrorFinger = 'Wrong fingerprint';
  stToastErrorDecrypt = 'Secret cannot be decrypted';

  constructor(private readonly notification: NotificationService) { }

  ngOnInit() {
  }

  onScanStart() {
    this.fingerClass = 'bluish icon-60';
  }

  onScanEnd() {
    this.fingerClass = 'color-cool_grey icon-60';
  }

  errorFingerScan() {
    this.notification.show(this.stToastErrorFinger);
  }

  errorDecrypt() {
    this.notification.show(this.stToastErrorDecrypt);
  }

}
