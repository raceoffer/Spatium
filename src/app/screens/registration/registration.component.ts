import {
  Component, Input, NgZone, OnInit, ElementRef,
  ViewChild, AfterViewInit
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {MatDialog} from '@angular/material';
import {DialogFactorsComponent} from '../dialog-factors/dialog-factors.component';
import * as $ from 'jquery';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit, AfterViewInit {

  stPassword = 'Password';
  isDisable = true;
  stRegistration = 'Sign up';
  username: string = null;
  stWarning = 'Your funds safety depends on the strongness of the authentication factors. Later you can add alternative authentication paths, however it is impossible to remove or alter existing paths.';
  _passwordValue = '';
  generateInProgress = false;
  advancedMode = false;

  @ViewChild('factorContainer') factorContainer: ElementRef;

  constructor(public  dialog: MatDialog,
              private readonly router: Router,
              private route: ActivatedRoute,
              private ngZone: NgZone,
              private authSevice: AuthService) {

    this.route.params.subscribe(params => {
      if (params['login']) {
        this.username = params['login'];
      }
    });
    this.advancedMode = false;
  }

  get Password() {
    return this._passwordValue;
  }

  @Input()
  set Password (newPassword) {
    this._passwordValue = newPassword;
    if (this._passwordValue.length > 0 && !this.generateInProgress && this.username.length > 0) {
      this.isDisable = false;
    } else {
      this.isDisable = true;
    }
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

  ngAfterViewInit() {
    if (this.factorContainer != null) {
      this.checkOverflow(this.factorContainer);
    }
  }

  checkOverflow (element) {
    if (element.nativeElement.offsetHeight < element.nativeElement.scrollHeight) {
      $('#bottom-scroller').fadeIn();
    } else {
      $('#bottom-scroller').fadeOut();
    }
  }

  goTop() {
    $('#factor-container').animate({scrollTop: 0}, 500, 'swing');
  }

  goBottom() {
    $('#factor-container').animate({scrollTop: $('#factor-container').height()}, 500, 'swing');
  }

  async generateNewLogin() {
    if (!this.generateInProgress) {
      this.generateInProgress = true;
      for (let i = 0; i < 3; i++) {
        this.username = this.makeNew();
        await this.checkingLoginInDDS();
      }
      this.generateInProgress = false;

      if (this._passwordValue.length > 0 && !this.generateInProgress && this.username.length > 0) {
        this.isDisable = false;
      }
    }
  }

  async checkingLoginInDDS() {
    await this.delay(3000);
  }

  makeNew() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 20; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  sddNewFactor() {
    this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'registration', next: 'registration' }
    });
  }

  openAdvanced() {
    this.advancedMode = true;
  }

}
