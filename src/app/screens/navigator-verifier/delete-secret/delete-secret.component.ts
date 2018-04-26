import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FileService } from '../../../services/file.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { NavigationService } from '../../../services/navigation.service';

declare const window: any;

@Component({
  selector: 'app-delete-secret',
  templateUrl: './delete-secret.component.html',
  styleUrls: ['./delete-secret.component.css']
})
export class DeleteSecretComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  private subscriptions = [];

  title = 'Deleting secret';
  description = 'Please confirm that you want to delete the secret from this device. Type the following word with respect to the register.';
  checkPhrase = 'delete';
  checkInput;
  confirmButton = 'Confirm';

  back = 'verify';

  hasTouch = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly fs: FileService,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly navigationService: NavigationService
  ) {
    this.checkPhrase = this.сapitalizeRandomChars(this.checkPhrase);
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.route.params.subscribe((params: Params) => {
      if (params['back']) {
        this.back = params['back'];
      }
    });

    if (window.plugins) {
      window.plugins.touchid.isAvailable(() => {
        window.plugins.touchid.has('spatium', () => {
          console.log('Touch ID avaialble and Password key available');
          this.hasTouch = true;
        }, () => {
          console.log('Touch ID available but no Password Key available');
        });
      }, () => {
        console.log('no touch id');
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    switch (this.back) {
      case 'pincode':
        await this.router.navigate(['/confirmation-entry', { back: 'start' }]);
        break;
      case 'verify-transaction':
        await  this.router.navigate(['/navigator-verifier', { outlets: { 'navigator': ['verify-transaction'] } }]);
        break;
    }
  }

  async delete() {
    if (this.hasTouch) {
      window.plugins.touchid.delete('spatium', async() => {
        console.log('Password key deleted');
        await this.deleteFileSecret();
      });
    } else {
      await this.deleteFileSecret();
    }
  }

  async deleteFileSecret() {
    await this.fs.deleteFile(this.fs.safeFileName('seed'));
    this.authService.encryptedSeed = null;
    this.notification.show('The secret successfully removed');
    await this.router.navigate(['/start']);
  }

  сapitalizeRandomChars(s: string) {
    const len = s.length;
    const c1 = this.getRandomNumber(0, len, undefined);
    const c2 = this.getRandomNumber(0, len, c1);

    s = s.toLowerCase();
    s = this.replaceAt(s, c1, s.charAt(c1).toUpperCase());
    s = this.replaceAt(s, c2, s.charAt(c2).toUpperCase());

    return s;
  }

  getRandomNumber(min: number, max: number, exclude: number) {
    const n = Math.floor(Math.random() * (max - min) + min);
    if (!exclude || n !== exclude) {
      return n;
    } else {
      return this.getRandomNumber(min, max, exclude);
    }
  }

  replaceAt(s: string, i: number, replacement: string) {
    return s.substr(0, i) + replacement + s.substr(i + replacement.length);
  }
}
