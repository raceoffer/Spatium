import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DeviceService, Platform } from '../../services/device.service';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent {
  public password: string = '';
  public caretClass = this.isWindows() ? 'caret-center' : '';

  @Input() action: string;
  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  onPasswordChange(newValue) {
    if (!newValue) {
      if (this.isWindows()) {
        this.caretClass = 'caret-center';
      }
      this.password = '';
    } else {
      this.caretClass = '';
      this.password = newValue;
    }
  }

  constructor(private readonly deviceService: DeviceService) {  }

  onSubmit() {
    this.submit.next(this.password);
  }

  isWindows(): boolean {
    return this.deviceService.platform === Platform.Windows;
  }
}
