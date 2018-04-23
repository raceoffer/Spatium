import {OnInit, Component, Output, EventEmitter, HostBinding} from '@angular/core';
import { FactorType } from '../../../services/auth.service';

declare const Buffer: any;

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  @HostBinding('class') classes = 'content factor-content text-center';

  @Output() isPasswordChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSuccess: EventEmitter<any> = new EventEmitter<any>();

  stContinue = 'Continue';
  stPassword = 'Password';

  password = '';

  constructor( ) { }

  ngOnInit() {
    this.password = '';
  }

  async goNext() {
    this.onSuccess.emit({factor: FactorType.PASSWORD, value: this.password});
      /*this.busy = true;
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
            await this.router.navigate(['/navigator', {outlets: {navigator: ['factornode']}}]);
            break;
        }
      }*/
  }

  onFocusOut() {
    this.stPassword = 'Password';
  }

  onFocus() {
    this.stPassword = '';
  }
}
