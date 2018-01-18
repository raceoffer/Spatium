import { Component, OnInit, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { BitcoinKeyFragmentService } from '../../services/bitcoin-key-fragment.service';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit {
  username = '';
  login = 'Log in';
  loginDisable = false;

  factors = [];

  constructor(private route: ActivatedRoute,
              private router: Router,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService,
              private walletService: WalletService,
              public dialog: MatDialog,
              private authSevice: AuthService,
              private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['username']) {
        this.username = params.username;
        this.authSevice.login = this.username;
        this.authSevice.clearFactors();
        this.cd.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    if (!this.username) {
      this.username = this.authSevice.login;
    }
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

    const keyFragment = await this.bitcoinKeyFragmentService.keyringFromSeed(data);
    this.walletService.setKeyFragment(keyFragment);
    await this.router.navigate(['/waiting']);
  }
}


