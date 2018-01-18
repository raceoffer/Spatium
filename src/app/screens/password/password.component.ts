import { Component, NgZone } from '@angular/core';
import { Router} from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent {
  next = 'Continue';
  stPassword = 'Password';
  password = '';
  isDisable = false;

  constructor(private readonly router: Router,
              private ngZone: NgZone,
              private authSevice: AuthService) { }

  goNext(): void {
    this.authSevice.addFactor({
      name: 'Password',
      icon: 'keyboard',
      value: this.password.toString(),
    });
    this.ngZone.run(async () => {
      await this.router.navigate(['/auth']);
    });
  }

}
