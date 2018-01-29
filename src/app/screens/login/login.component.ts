import {Component, Input} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;

@Component({
  selector: 'app-login',
  host: {'class':'child'},
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  entry = 'Log in';
  stLogin = 'Username';
  _userName = '';
  isDisable = true;

  ngAfterViewInit() {
    this._userName = '';
  }

  get UserName() {
    return this._userName;
  }

  @Input()
  set UserName(newUserName) {
    this._userName = newUserName;
    if (this._userName.length > 1){
      this.isDisable = false;
      console.log(this.isDisable);
    } else {
      this.isDisable = true;
      console.log(this.isDisable);
    }
  }

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) { }

  async letLogin() {
    if(this._userName != '') {
      if (await LoginComponent.isEthernetAvailable()) {
      this.authService.login = this._userName;
      this.authService.clearFactors();

      try {
        this.authService.encryptedSeed = await this.fs.readFile(this.fs.safeFileName(this._userName));
      } catch (e) {
        this.authService.encryptedSeed = null;
        this.notification.show('No stored seed found');
      }

      await this.router.navigate(['/auth']);
      } else {
      this.notification.show('No connection');
      }
    }
  }
}
