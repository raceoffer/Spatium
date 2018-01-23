import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

declare const window: any;
declare const Utils: any;
declare const Buffer: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  entry = 'Log in';
  stLogin = 'Username';
  userName = '';

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) { }

  async letLogin() {
    if (await LoginComponent.isEthernetAvailable()) {
      this.authService.login = this.userName;
      this.authService.clearFactors();

      try {
        this.authService.encryptedSeed = await new Promise<string>((resolve, reject) => {
          window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
            fs.root.getFile(Buffer.from(this.userName, 'utf-8').toString('base64') + '.store', {create: false}, fileEntry => {
              fileEntry.file(file => {
                const reader = new FileReader();
                reader.onloadend = (e: any) => {
                  const initiatorDDSKey = e.target.result;
                  resolve(initiatorDDSKey);
                };
                reader.readAsText(file);
              });
            }, reject);
          });
        });
      } catch (e) {
        this.authService.encryptedSeed = null;
      }

      await this.router.navigate(['/auth']);
    } else {
      window.plugins.toast.showLongBottom('No connection', 3000, 'No connection', console.log('No connection'));
    }
  }
}
