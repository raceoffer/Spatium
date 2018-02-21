import {
  Component, OnInit, ElementRef,
  ViewChild, AfterViewInit, ChangeDetectorRef, trigger, transition, sequence, animate, style
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { KeyChainService } from '../../services/keychain.service';
import * as $ from 'jquery';
import { DDSService } from '../../services/dds.service';
import {NotificationService} from "../../services/notification.service";

declare const Utils: any;

@Component({
  selector: 'app-registration',
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

  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  constructor(
    public  dialog: MatDialog,
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly authSevice: AuthService
  ) {
    this.changeDetectorRef = changeDetectorRef;
  }

  ngOnInit() {
    this.username = this.authSevice.login;
    this.password = this.authSevice.password;
    this.factors = this.authSevice.factors;
    this.advancedMode = this.factors.length > 0;

    if (this.advancedMode) {
      this.factorContainer.nativeElement.classList.add('content');
    }

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

    this.checkOverflow(this.factorContainer);
    this.goBottom();

    this.changeDetectorRef.detectChanges();
  }

  checkOverflow (element) {
    if (element.nativeElement.offsetHeight < element.nativeElement.scrollHeight) {
      $('#bottom-scroller').fadeIn();
    } else {
      $('#bottom-scroller').fadeOut();
    }
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

  addNewFactor() {
    this.authSevice.password = this.password;
    const dialogRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'registration', next: 'registration' }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
    });
  }

  removeFactor(factor): void {
    this.authSevice.rmFactor(factor);
    this.factors = this.authSevice.factors;
    this.changeDetectorRef.detectChanges();

    this.sleep(650).then(() => {
      this.checkOverflow(this.factorContainer);
    });
  }

  openAdvanced() {
    this.advancedMode = true;
    this.factorContainer.nativeElement.classList.add('content');
  }

  async signUp() {
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

    this.authSevice.clearFactors();
    this.authSevice.password = '';
    this.factors = [];
    this.password = '';

    const id = Utils.sha256(Buffer.from(this.authSevice.login, 'utf-8')).toString('hex');
    const data = Utils.packTree(tree, node => node.factor, this.keychain.getSeed());

    try {
      await this.dds.sponsorStore(id, data);
      await this.router.navigate(['/reg-success']);
    } catch (ignored) {
      this.notification.show('Failed to upload the secret');
    }
  }

  async sleep(ms: number) {
    await this._sleep(ms);
  }

  _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
