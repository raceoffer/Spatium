import { OnInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';

@Component({
  selector: 'app-password',
  host: {'class': 'child'},
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  stContinue = 'Continue';
  stPassword = 'Password';

  password = '';

  next: string = null;
  back: string = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
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

  ngOnInit() {
    this.password = '';
  }

  async goNext() {
    if (this.password !== '') {
      switch (this.next) {
        case 'auth':
          this.authService.addAuthFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          await this.router.navigate(['/auth']);
          break;
        case 'registration':
          this.authService.addFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          await this.router.navigate(['/registration']);
          break;
        case 'factornode':
          this.authService.addFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
          break;
      }
    }
  }

}
