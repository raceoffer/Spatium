import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';

declare const window: any;
declare const Utils: any;
declare const Buffer: any;

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
    private router: Router,
    private walletService: WalletService,
    public dialog: MatDialog,
    private authSevice: AuthService,
    private cd: ChangeDetectorRef
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

    console.log(data);

    const aesKey = await Utils.deriveAesKey(Buffer.from(data, 'utf-8'));

    try {
      if (this.authSevice.encryptedSeed) {
        const ciphertext = Buffer.from(this.authSevice.encryptedSeed, 'hex');
        this.walletService.seed = Utils.decrypt(ciphertext, aesKey);
      } else {
        this.walletService.seed = Utils.randomBytes(64);
        this.authSevice.encryptedSeed = Utils.encrypt(this.walletService.seed, aesKey).toString('hex');

        await new Promise((resolve, reject) => {
          window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
            fs.root.getFile(Buffer.from(this.username, 'utf-8').toString('base64') + '.store', {create: true}, fileEntry => {
              fileEntry.createWriter(fileWriter => {
                const tdata = new Blob([this.authSevice.encryptedSeed], {type: 'text/plain'});
                fileWriter.write(tdata);
                resolve();
              });
            });
          });
        });
      }

      console.log(this.walletService.seed.toString('hex'));

      await this.router.navigate(['/waiting']);
    } catch (e) {
      console.log('Auth failed');
    }
  }
}


