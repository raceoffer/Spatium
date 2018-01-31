import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;

@Component({
  selector: 'app-login',
  host: {'class': 'child'},
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements AfterViewInit, OnInit {
  private _userName = '';

  entry = 'Sign in';
  buttonState = 0;
  stLogin = 'Username';
  isDisable = true;
  isCheckingInProcess = false;
  timer;

  static async isEthernetAvailable() {
    return await Utils.testNetwork();
  }

  ngOnInit() {
    this.isCheckingInProcess = false;
  }

  ngAfterViewInit() {
    this.userName = '';
  }

  get userName() {
    return this._userName;
  }

  set userName(newUserName) {
    this._userName = newUserName;
    if (this._userName.length > 0) {
      this.isDisable = false;
      console.log(this.isDisable);
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = this.timeout();
    } else {
      this.isDisable = true;
      console.log(this.isDisable);
    }
  }

  timeout() {
    this.timer = setTimeout(() => {
      this.checkingLogin();
    }, 1000);
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) { }

  async checkingLogin() {
    this.isCheckingInProcess = true;
    await this.delay(5000);
    this.entry = 'Sign Up';
    this.isCheckingInProcess = false;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
