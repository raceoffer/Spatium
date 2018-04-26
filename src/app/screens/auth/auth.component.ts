import {
  Component, AfterViewInit, ChangeDetectorRef, OnInit, ElementRef,
  ViewChild, trigger, transition, style, animate, sequence, OnDestroy, HostBinding
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { AuthService, FactorIconAsset, LoginType } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { KeyChainService } from '../../services/keychain.service';
import * as $ from 'jquery';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import {FactorParentOverlayRef} from "../factor-parent-overlay/factor-parent-overlay-ref";
import {FactorParentOverlayService} from "../factor-parent-overlay/factor-parent-overlay.service";

declare const Buffer: any;

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
export class AuthComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild(FactorParentOverlayRef) child;
  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  busy = false;

  private subscriptions = [];

  username = '';
  login = 'Sign in';

  factors = [];

  ready = false;
  loginType = LoginType.LOGIN;
  isPasswordFirst = false;

  icon_qr = '';

  dialogFactorRef = null;

  constructor(
    public dialog: MatDialog,
    public factorParentDialog: FactorParentOverlayService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService,
    private readonly navigationService: NavigationService
  ) {  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.loginType = this.authService.loginType;
    this.isPasswordFirst = this.authService.isPasswordFirst;
    this.icon_qr = FactorIconAsset.QR;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    if (this.dialogFactorRef) {
      this.dialogFactorRef.close();
      this.dialogFactorRef = null;
    }
    if (this.child) {
      this.child.close();
      this.child = null;
    }
  }

  isPasswordChanged(val) {
    this.isPasswordFirst = val;
    this.ready = this.authService.decryptedSeed !== null;
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

    if (this.loginType !== LoginType.LOGIN && this.factors.length === 0) {
      this.addNewFactor();
    }
  }

  addNewFactor(): void {
    this.dialogFactorRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { isColored: false, isShadowed: false }
    });

    this.dialogFactorRef.componentInstance.goToFactor.subscribe((result) => {
      this.openFactorOverlay(result);
    });

    this.dialogFactorRef.afterClosed().subscribe(() => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
      this.dialogFactorRef = null;
    });
  }

  async openFactorOverlay(component) {
    if (typeof component !== 'undefined') {
      this.child = this.factorParentDialog.open({
        label: '',
        isColored: false,
        isShadowed: false,
        content: component
      });

      this.child.onAddFactor.subscribe((result) => {
        this.addFactor(result);
        this.child.close();
        this.child = null;
      });

      this.child.onBackClicked.subscribe(() => {
        this.onBackClicked();
      });
    }
  }

  removeFactor(factor): void {
    this.isPasswordFirst = this.authService.rmAuthFactor(factor);
    this.factors = this.authService.factors;
    this.ready = this.authService.decryptedSeed !== null;
    this.changeDetectorRef.detectChanges();
  }

  async addFactor(result) {
    try {
      this.goBottom();
      this.busy = true;
      this.isPasswordFirst = true;
      this.isPasswordFirst = await this.authService.addAuthFactor(result.factor, Buffer.from(result.value, 'utf-8'));
      this.ready = this.authService.decryptedSeed !== null;
    } catch (e) {
      console.log(e);
    } finally {
      this.busy = false;
    }
  }

  async letLogin() {
    if (!this.authService.decryptedSeed) {
      this.notification.show('Authorization error');
      return;
    }

    this.keyChain.setSeed(this.authService.decryptedSeed);
    this.authService.reset();

    await this.router.navigate(['/navigator', { outlets: { navigator: ['waiting'] } }]);
  }

  async onBackClicked() {
    if (this.dialogFactorRef != null) {
      this.dialogFactorRef.close();
      this.dialogFactorRef = null;
    } else if (this.child != null) {
      this.child.close();
      this.child = null;
    } else {
      await this.router.navigate(['/login']);
    }
  }
}


