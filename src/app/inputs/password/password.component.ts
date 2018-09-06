import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent {
  public password: string = '';

  @Input() action: string;
  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  onSubmit() {
    this.submit.next(this.password);
  }
}
