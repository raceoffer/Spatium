import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NotificationService } from '../../services/notification.service';
import {KeyChainService} from "../../services/keychain.service";

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
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService
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

  matchPredefinedRoute(forest, route) {
    let currentFactor = 0;
    let currentData = forest;
    let result = null;
    while (!result) {
      const requestedFactor = currentFactor < route.length ? route[currentFactor++] : null;
      if (!requestedFactor) {
        break;
      }

      const matchResult = Utils.matchPassphrase(currentData, requestedFactor);
      if (typeof matchResult.seed !== 'undefined') {
        result = matchResult.seed;
        break;
      }

      if (matchResult.subtexts.length < 1) {
        break;
      }

      currentData = matchResult.subtexts;
    }

    return result;
  }

  async letLogin() {
    const factors = this.factors.map((factor) => {
      const prefix = Buffer.alloc(4);
      prefix.readInt8(factor.type);

      return Utils.sha256(Buffer.concat([prefix, factor.value]));
    });

    const seed = this.matchPredefinedRoute(this.authSevice.remoteEncryptedTrees, factors);
    if (!seed) {
      this.notification.show('Authorization error');
      return;
    }

    this.keyChain.seed = seed;
    this.walletService.secret = this.keyChain.getBitcoinSecret(0);

    await this.router.navigate(['/waiting']);
  }
}


