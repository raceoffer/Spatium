import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FileService } from '../../../services/file.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import {NavigationService} from '../../../services/navigation.service';

@Component({
  selector: 'app-delete-secret',
  templateUrl: './delete-secret.component.html',
  styleUrls: ['./delete-secret.component.css']
})
export class DeleteSecretComponent implements OnInit, OnDestroy {
  private subscriptions = [];

  title = 'Deleting secret';
  description = 'Please confirm that you want to delete the secret from this device. Type the following word with respect to the register.';
  checkPhrase = 'delete';
  checkInput;
  confirmButton = 'Confirm';

  back = 'verify';

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
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    switch (this.back) {
      case 'pincode':
        await this.router.navigate(['/factor', { back: 'start' }, { outlets: {'factor': ['pincode', { next: 'waiting' }]}}]);
        break;
      case 'verify-transaction':
        await  this.router.navigate(['/navigator-verifier', { outlets: { 'navigator': ['verify-transaction'] } }]);
        break;
    }
  }

  async delete() {
    try {
      await this.fs.deleteFile(this.fs.safeFileName('seed'));
      this.authService.encryptedSeed = null;
      this.notification.show('The secret successfully removed');
      await this.router.navigate(['/start']);
    } catch (e) {
      this.notification.show('Delete error');
      return;
    }
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
