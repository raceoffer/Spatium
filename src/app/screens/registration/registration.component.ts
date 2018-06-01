import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  animate,
  sequence,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import * as $ from 'jquery';

import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DialogFactorsComponent } from '../../modals/dialog-factors/dialog-factors.component';
import { FactorParentOverlayRef } from '../../modals/factor-parent-overlay/factor-parent-overlay-ref';
import { FactorParentOverlayService } from '../../modals/factor-parent-overlay/factor-parent-overlay.service';
import { AuthService, FactorType } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';

declare const device: any;

import { packTree } from 'crypto-core-async/lib/utils';

@Component({
  selector: 'app-registration',
  animations: [
    trigger('anim', [
      transition('* => void', [
        style({height: '*', opacity: '1', transform: 'translateX(0)'}),
        sequence([
          animate('.5s ease', style({height: '*', opacity: '.2', transform: 'translateX(60px)'})),
          animate('.1s ease', style({height: '*', opacity: 0, transform: 'translateX(60px)'}))
        ])
      ]),
    ])],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild(FactorParentOverlayRef) child;
  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;
  stPassword = 'Password';
  stPasswordConfirm = 'Confirm password';
  stRegistration = 'Sign up';
  username: string = null;
  stWarning =
    'Your funds safety depends on the strongness of the authentication factors. ' +
    'Later you can add alternative authentication paths, however it is impossible to remove or alter existing paths.';
  password = '';
  password_confirm = '';
  advancedMode = false;
  factors = [];
  uploading = false;
  cancel = new Subject<boolean>();
  dialogFactorRef = null;
  private subscriptions = [];

  constructor(
    public dialog: MatDialog,
    public factorParentDialog: FactorParentOverlayService,
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) {
    this.changeDetectorRef = changeDetectorRef;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.username = this.authService.login;
    this.password = this.authService.password;
    this.factors = this.authService.factors;
    this.advancedMode = this.factors.length > 0;

    if (this.advancedMode) {
      this.factorContainer.nativeElement.classList.add('content');
    }
  }

  ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
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

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  addNewFactor() {
    this.authService.password = this.password;
    this.dialogFactorRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: {isColored: false, isShadowed: false}
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
    this.authService.rmFactor(factor);
    this.factors = this.authService.factors;
    this.changeDetectorRef.detectChanges();
  }

  async addFactor(result) {
    try {
      await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
      this.goBottom();
    } catch (e) {
      console.log(e);
    }
  }

  openAdvanced() {
    this.advancedMode = true;
    this.factorContainer.nativeElement.classList.add('content');
  }

  async onBackClicked() {
    this.cancel.next(true);

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

  isWindows(): boolean {
    return device.platform === 'windows';
  }

  async signUp() {
    try {
      this.uploading = true;

      if (!this.passwordsIsMatching()) {
        throw {
          message: 'Passwords do not match. Please try again.',
          name: 'PassNotMatch'
        };
      }

      let factors = [];
      for (let i = 0; i < this.factors.length; ++i) {
        factors.push(await this.factors[i].toBuffer());
      }

      factors = factors.reverse();

      factors.push(await this.authService.newFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8')).toBuffer());

      const tree = factors.reduce((rest, factor) => {
        const node = {
          factor: factor
        };
        if (rest) {
          node['children'] = [rest];
        }
        return node;
      }, null);

      const id = await this.authService.toId(this.authService.login.toLowerCase());
      console.log(`RegistrationComponent.signUp: this.authService.login=${this.authService.login.toLowerCase()}`);
      const data = await packTree(tree, this.keychain.getSeed(), this.workerService.worker);
      this.authService.currentTree = data;

      try {
        const success = await this.dds.sponsorStore(id, data).pipe(take(1), takeUntil(this.cancel)).toPromise();
        if (!success) {
          await this.router.navigate(['/backup', { back: 'registration'}]);
          return;
        }

        this.authService.clearFactors();
        this.authService.password = '';
        this.authService.currentTree = null;
        this.factors = [];
        this.password = '';

        await this.router.navigate(['/reg-success']);
      } catch (ignored) {
        await this.router.navigate(['/backup', { back: 'registration'}]);
      }
    } catch (e) {
      this.notification.show(e.message);
    } finally {
      this.uploading = false;
    }
  }

  passwordsIsMatching() {
    return (this.password === this.password_confirm);
  }

  onFocusOut() {
    this.stPassword = 'Password';
  }

  onFocus() {
    this.stPassword = '';
  }

  onFocusOutConfirm() {
    this.stPasswordConfirm = 'Confirm password';
  }

  onFocusConfirm() {
    this.stPasswordConfirm = '';
  }
}
