import {Component, Input, NgZone, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

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

  constructor(private readonly router: Router,
              private ngZone: NgZone,
              private authSevice: AuthService) { }

  ngOnInit() {
  }

  goNext(): void {
    this.authSevice.addFactor({
      name: 'Password',
      icon: 'keyboard',
      value: this._passwordValue.toString(),
    });
    this.ngZone.run(() => {
      this.router.navigate(['/auth']);
    });
  }

}
