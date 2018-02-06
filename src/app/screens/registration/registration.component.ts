import {
  Component, NgZone, OnInit, ElementRef,
  ViewChild, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {AuthService, FactorType} from '../../services/auth.service';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';
import { WalletService } from '../../services/wallet.service';
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
  stWarning =
    'Your funds safety depends on the strongness of the authentication factors. ' +
    'Later you can add alternative authentication paths, however it is impossible to remove or alter existing paths.';
  password = '';
  advancedMode = false;

  factors = [];

  stateType = State;
  usernameState = State.Ready;

  @ViewChild('factorContainer') factorContainer: ElementRef;

  constructor(
    public  dialog: MatDialog,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone,
    private readonly wallet: WalletService,
    private readonly keychain: KeyChainService,
    private readonly cd: ChangeDetectorRef,
    private readonly authSevice: AuthService,
    private readonly notification: NotificationService,
    private readonly dds: DDSService
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

  ngAfterViewInit() {
    this.username = this.authSevice.login;
    this.password = this.authSevice.password;
    this.factors = this.authSevice.factors;
    this.advancedMode = this.factors.length > 0;
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
    this.authSevice.password = this.password;
    this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'registration', next: 'registration' }
    });
  }

  removeFactor(factor): void {
    this.authSevice.rmFactor(factor);
    this.factors = this.authSevice.factors;
    this.cd.detectChanges();
  }

  openAdvanced() {
    this.advancedMode = true;
  }

  async submit() {
    const factors = this.factors.map(factor => factor.toBuffer()).reverse();
    factors.push(this.authSevice.newFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8')).toBuffer());
    const tree = factors.reduce((rest, factor) => {
      const node = {
        factor: factor
      };
      if (rest) {
        node['children'] = [ rest ];
      }
      return node;
    }, null);
    const seed = Utils.randomBytes(64);
    const encrypted = Utils.packTree(tree, node => node.factor, seed);

    this.keychain.seed = seed;
    this.wallet.secret = this.keychain.getBitcoinSecret(0);
    this.authSevice.encryptedTreeData = encrypted;
    this.authSevice.ethereumSecret = this.keychain.getEthereumSecret(0);

    await this.router.navigate(['/backup']);
  }
}
