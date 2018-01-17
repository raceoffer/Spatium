import {Component, Input, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

declare var window;

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {

  stContinue = 'Continue';
  stPassword = 'Password';
  _passwordValue = '';
  isDisable = false;

  next: string = null;
  back: string = null;

  get passwordValue() {
    return this._passwordValue;
  }

  @Input()
  set passwordValue(value) {
    this._passwordValue = value;
  }

  constructor(private readonly router: Router,
              private route: ActivatedRoute,
              private ngZone: NgZone,
              private authSevice: AuthService) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

  ngOnInit() {
  }

  goNext(): void {
    if (this.next && this.next === 'auth') {
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

}
