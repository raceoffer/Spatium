import { AfterViewInit, Component, NgZone } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService, FactorType} from '../../services/auth.service';

@Component({
  selector: 'app-password',
  host: {'class': 'child'},
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements AfterViewInit {
  stContinue = 'Continue';
  stPassword = 'Password';

  password = '';

  next: string = null;
  back: string = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone,
    private readonly authService: AuthService
  ) {
    this.route.params.subscribe(params => {
      if (params['next']) {
        this.next = params['next'];
      }
      if (params['back']) {
        this.back = params['back'];
      }
    });
  }

  ngAfterViewInit() {
    this.password = '';
  }

  goNext(): void {
    if (this.password !== '') {
      if (this.next && this.next === 'auth') {
        this.authService.addAuthFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));

        this.ngZone.run(async () => {
          await this.router.navigate(['/auth']);
        });
      } else if (this.next && this.next === 'registration') {
        this.authService.addFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));

        this.ngZone.run(async () => {
          await this.router.navigate(['/registration']);
        });
      } else if (this.next && this.next === 'factornode') {
        this.authService.addFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));

        this.ngZone.run(async () => {
          await this.router.navigate(['/factornode']);
        });
      }
    }
  }

}
