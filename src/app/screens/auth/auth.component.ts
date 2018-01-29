import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';

declare const Utils: any;

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements AfterViewInit {
  username = '';
  login = 'Log in';
  loginDisable = false;

  factors = [];

  constructor(
    public  dialog: MatDialog,
    private readonly router: Router,
    private readonly walletService: WalletService,
    private readonly authSevice: AuthService,
    private readonly cd: ChangeDetectorRef,
    private readonly fs: FileService,
    private readonly notification: NotificationService
  ) { }

  ngAfterViewInit() {
    this.username = this.authSevice.login;
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
  }

  sddNewFactor(): void {
    this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { }
    });
  }

  removeFactor(factor): void {
    this.authSevice.rmFactor(factor);
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
  }

  async letLogin() {
    let data = this.username;
    for (const factor of this.factors) {
      data += factor.value;
    }

    const aesKey = await Utils.deriveAesKey(Buffer.from(data, 'utf-8'));

    try {
      if (this.authSevice.encryptedSeed) {
        const ciphertext = Buffer.from(this.authSevice.encryptedSeed, 'hex');
        this.walletService.seed = Utils.decrypt(ciphertext, aesKey);
      } else {
        this.walletService.seed = Utils.randomBytes(64);
        this.authSevice.encryptedSeed = Utils.encrypt(this.walletService.seed, aesKey).toString('hex');

        await this.fs.writeFile(this.fs.safeFileName(this.username), this.authSevice.encryptedSeed);
      }

      await this.router.navigate(['/waiting']);
    } catch (e) {
      this.notification.show('Authorization error');
    }
  }
}


