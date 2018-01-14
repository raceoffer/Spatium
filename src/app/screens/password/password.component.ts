import {Component, Input, OnInit} from '@angular/core';
import {Router} from "@angular/router";

declare var window;

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {

  next = 'Continue';
  stPassword = 'Password';
  _passwordValue = '';
  isDisable = false;

  get passwordValue() {
    return this._passwordValue;
  }

  @Input()
  set passwordValue(value) {
    this._passwordValue = value;
  }

  constructor(private readonly router: Router) { }

  ngOnInit() {
  }

  goNext(): void {
    this.router.navigate(['/auth'], { queryParams: { username: this._passwordValue } });
  }

}
