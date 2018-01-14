import {Component, OnInit, AfterViewInit, NgZone, ChangeDetectorRef} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MAT_DIALOG_DATA, MatDialog} from "@angular/material";
import {DialogFactorsComponent} from "../dialog-factors/dialog-factors.component";
import {BitcoinKeyFragmentService} from "../../services/bitcoin-key-fragment.service";
import {WalletService} from "../../services/wallet.service";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit {

  username = '';
  login = 'Log in'
  loginDisable = false;

  //из службы
  factors = [];

  constructor(private route: ActivatedRoute,
              private router: Router,
              private bitcoinKeyFragmentService: BitcoinKeyFragmentService,
              private walletService: WalletService,
              public dialog: MatDialog,
              private authSevice: AuthService,
              private cd: ChangeDetectorRef,
              private ngZone: NgZone) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.username = params.username;
    });
  }

  ngAfterViewInit() {
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
  }

  sddNewFactor(): void {
    let dialogRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => this.ngZone.run(() => {
      console.log('The dialog was closed');
      // zzzzzzzz
      this.authSevice.addFactor({
        name: 'Password',
        icon: 'keyboard',
        value: 'dlkfsjlkfsd',
      });
      ///
      this.factors = this.authSevice.factors;
      this.cd.detectChanges();
    }));
  }

  removeFactor(factor): void {
    this.authSevice.rmFactor(factor);
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
  }

  async letLogin() {
    const keyFragment = await this.bitcoinKeyFragmentService.keyringFromSeed(this.username);
    this.walletService.setKeyFragment(keyFragment);
    this.router.navigate(['/waiting']);
  }
}


