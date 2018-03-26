import {OnInit, Component, Output, EventEmitter} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';

declare const Buffer: any;

@Component({
  selector: 'app-password',
  host: {'class': 'child content text-center'},
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  @Output() isPasswordChanged: EventEmitter<any> = new EventEmitter<any>();

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
        case null:
          const isPassword = await this.authService.addAuthFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          this.isPasswordChanged.emit(isPassword);
          break;
        case 'auth':
          await this.authService.addAuthFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          await this.router.navigate(['/auth']);
          break;
        case 'registration':
          await this.authService.addFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          await this.router.navigate(['/registration']);
          break;
        case 'factornode':
          await this.authService.addFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8'));
          await this.router.navigate(['/navigator', { outlets: { navigator: ['factornode'] } }]);
          break;
      }
    }
  }

}
