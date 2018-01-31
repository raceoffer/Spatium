import {AfterViewInit, Component, Input, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService, FactorType} from "../../services/auth.service";

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements AfterViewInit {

  stContinue = 'Continue';
  stPassword = 'Password';
  _passwordValue = '';
  isDisable = true;

  next: string = null;
  back: string = null;

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

  get Password() {
    return this._passwordValue;
  }

  @Input()
  set Password(newPassword) {
    this._passwordValue = newPassword;
    if (this._passwordValue.length > 1){
      this.isDisable = false;
      console.log(this.isDisable);
    } else {
      this.isDisable = true;
      console.log(this.isDisable);
    }
  }

  ngAfterViewInit() {
    this._passwordValue = '';
  }

  goNext(): void {
    if(this._passwordValue != '') {
      if (this.next && this.next === 'auth') {
        this.authSevice.addFactor(FactorType.PASSWORD, this._passwordValue.toString());
        this.ngZone.run(async () => {
          await this.router.navigate(['/auth']);
        });
      }
    }
  }

}
