import {
  Component, AfterViewInit, ChangeDetectorRef, OnInit, ElementRef,
  ViewChild, trigger, transition, style, animate, sequence, AfterViewChecked
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import {AuthService, FactorType} from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {KeyChainService} from '../../services/keychain.service';
import * as $ from 'jquery';
import {Router} from '@angular/router';

declare const Utils: any;

@Component({
  selector: 'app-auth',
  animations: [
    trigger('anim', [
      transition('* => void', [
        style({ height: '*', opacity: '1', transform: 'translateX(0)'} ),
        sequence([
          animate('.5s ease', style({ height: '*', opacity: '.2', transform: 'translateX(60px)' })),
          animate('.1s ease', style({ height: '*', opacity: 0, transform: 'translateX(60px)' }))
        ])
      ]),
    ])],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit {
  username = '';
  login = 'Sign in';

  factors = [];

  ready = false;
  isLoginAuth = false;
  isPasswordFirst = false;

  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  constructor(
    public dialog: MatDialog,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService
  ) {
    this.dialog = dialog;
  }

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

    this.isLoginAuth = this.authService.isLoginAuth;
    this.isPasswordFirst = this.authService.isPasswordFirst;
  }

  isPasswordChanged(val) {
    this.isPasswordFirst = val;
  }

  goTop() {
    const container = $('#factor-container');
    container.animate({scrollTop: 0}, 500, 'swing');
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  ngAfterViewInit() {
    this.username = this.authService.login;
    this.factors = this.authService.factors;
    this.ready = this.authService.decryptedSeed !== null;
    this.changeDetectorRef.detectChanges();
    this.checkOverflow(this.factorContainer);
    this.goBottom();

    if (!this.isLoginAuth) {
      this.sddNewFactor();
    }
  }

  checkOverflow (element) {
    if (element.nativeElement.offsetHeight < element.nativeElement.scrollHeight) {
      $('#bottom-scroller').fadeIn();
    } else {
      $('#bottom-scroller').fadeOut();
    }
  }

  sddNewFactor(): void {
    const dialogRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'auth', next: 'auth' }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
    });
  }

  removeFactor(factor): void {
    this.isPasswordFirst = this.authService.rmAuthFactor(factor);
    this.factors = this.authService.factors;
    this.ready = this.authService.decryptedSeed !== null;
    this.changeDetectorRef.detectChanges();

    this.sleep(650).then(() => {
      this.checkOverflow(this.factorContainer);
    });
  }

  async letLogin() {
    if (!this.authService.decryptedSeed) {
      this.notification.show('Authorization error');
      return;
    }

    this.keyChain.setSeed(this.authService.decryptedSeed);
    this.authService.reset();

    await this.router.navigate(['/waiting']);
  }

  async sleep(ms: number) {
    await this._sleep(ms);
  }

  _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


