import {
  Component, AfterViewInit, ChangeDetectorRef, OnInit, Inject, NgZone, ElementRef,
  ViewChild
} from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { WalletService } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {KeyChainService} from '../../services/keychain.service';
import * as $ from 'jquery';

declare const Utils: any;

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit {
  username = '';
  login = 'Sign in';
  loginDisable = false;

  factors = [];

  @ViewChild('factorContainer') factorContainer: ElementRef;

  constructor(
    public  dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone,
    private readonly router: Router,
    private readonly walletService: WalletService,
    private readonly authSevice: AuthService,
    private readonly cd: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService
  ) { }

  ngOnInit() {
    $('#factor-container').scroll(function () {
      if ($(this).scrollTop() > 0) {
        $('#top-scroller').fadeIn();
      } else {
        $('#top-scroller').fadeOut();
      }

      if ($(this).scrollTop() <  ($(this)[0].scrollHeight - $(this).height()) ) {
        $('#bottom-scroller').fadeIn();
      } else {
          $('#bottom-scroller').fadeOut();
        }
    });
  }

  goTop() {
    $('#factor-container').animate({scrollTop: 0}, 500, 'swing');
  }

  goBottom() {
    $('#factor-container').animate({scrollTop: $('#factor-container').height()}, 500, 'swing');
  }

  ngAfterViewInit() {
    this.username = this.authSevice.login;
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
    this.checkOverflow(this.factorContainer);
    this.goBottom();
  }

  checkOverflow (element) {
    if (element.nativeElement.offsetHeight < element.nativeElement.scrollHeight) {
      $('#bottom-scroller').fadeIn();
    } else {
      $('#bottom-scroller').fadeOut();
    }
  }

  sddNewFactor(): void {
    this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'auth', next: 'auth' }
    });
  }

  removeFactor(factor): void {
    this.authSevice.rmFactor(factor);
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
  }

  private matchPredefinedRoute(forest, route) {
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
    const factors = this.factors.map(factor => factor.toBuffer());

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


