import { Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent {
  stContinue = 'Continue';
  stPassword = 'Password';
  password = '';
  isDisable = false;

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

  goNext(): void {
    if (this.next && this.next === 'auth') {
      this.authSevice.addFactor(AuthService.FactorType.PASSWORD, this.password.toString());
    this.ngZone.run(async () => {
      await this.router.navigate(['/auth']);
      });
    }
  }

}
