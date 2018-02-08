import {
  Component, AfterViewInit, ChangeDetectorRef, OnInit, ElementRef,
  ViewChild, trigger, transition, style, animate, sequence
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { AuthService } from '../../services/auth.service';
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
  loginDisable = false;

  factors = [];

  findSecret = false;

  @ViewChild('factorContainer') factorContainer: ElementRef;

  constructor(
    public dialog: MatDialog,
    private readonly router: Router,
    private readonly authSevice: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService
  ) {
    this.changeDetectorRef = changeDetectorRef;
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
    this.changeDetectorRef.detectChanges();
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
    this.authSevice.rmAuthFactor(factor);
    this.factors = this.authSevice.factors;
    this.changeDetectorRef.detectChanges();
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

    await this.router.navigate(['/waiting']);
  }
}


