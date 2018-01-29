import { AfterViewInit, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements AfterViewInit {
  entry = 'Log in';
  stLogin = 'Username';
  userName = '';
  isDisable = true;

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  ngAfterViewInit() {
    this.userName = '';
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) { }

  async letLogin() {
    if (this.userName !== '') {
      if (await LoginComponent.isEthernetAvailable()) {
        this.authService.login = this.userName;
        this.authService.clearFactors();

        try {
          this.authService.encryptedSeed = await this.fs.readFile(this.fs.safeFileName(this.userName));
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
