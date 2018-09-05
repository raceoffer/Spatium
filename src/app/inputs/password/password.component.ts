import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent {
  public password: string = '';
  public caretClass = 'caret-center';

  @Input() action: string;
  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  onPasswordChange(newValue) {
    if (!newValue) {
      this.caretClass = 'caret-center';
      this.password = '';
    } else {
      this.caretClass = '';
      this.password = newValue;
    }
  }

  onSubmit() {
    this.submit.next(this.password);
  }
}
