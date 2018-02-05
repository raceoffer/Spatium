import {
  Component, Input, NgZone, OnInit, ElementRef,
  ViewChild, AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';
import * as $ from 'jquery';

declare const Utils: any;

enum State {
  Ready,
  Updating,
  Exists,
  Error
}

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit, AfterViewInit {
  stPassword = 'Password';
  stRegistration = 'Sign up';
  username: string = null;
  stWarning = 'Your funds safety depends on the strongness of the authentication factors. Later you can add alternative authentication paths, however it is impossible to remove or alter existing paths.';
  password = '';
  advancedMode = false;

  stateType = State;
  usernameState = State.Ready;

  @ViewChild('factorContainer') factorContainer: ElementRef;

  constructor(public  dialog: MatDialog,
              private readonly router: Router,
              private readonly route: ActivatedRoute,
              private readonly ngZone: NgZone,
              private readonly authSevice: AuthService,
              private readonly notification: NotificationService,
              private readonly dds: DDSService) {
    this.advancedMode = false;
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
    this.username = this.authSevice.login;
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
    if (!await Utils.testNetwork()) {
      this.notification.show('No network connection');
      this.usernameState = State.Error;
      return;
    }
    this.usernameState = State.Updating;
    try {
      do {
        this.username = this.makeNew();
        const exists = await this.dds.exists(AuthService.toId(this.username));
        if (!exists) {
          this.usernameState = State.Ready;
          break;
        }
      } while (true);
    } catch (ignored) {
      this.usernameState = State.Error;
    }
  }

  makeNew() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 20; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
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
