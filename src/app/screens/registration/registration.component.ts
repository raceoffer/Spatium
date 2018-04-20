import {
  Component, OnInit, ElementRef,
  ViewChild, AfterViewInit, ChangeDetectorRef, trigger, transition, sequence, animate, style, OnDestroy, HostBinding
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, FactorType } from '../../services/auth.service';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../dialog-factors/dialog-factors.component';
import { KeyChainService } from '../../services/keychain.service';
import * as $ from 'jquery';
import { DDSService } from '../../services/dds.service';
import { NotificationService } from '../../services/notification.service';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/take';
import { NavigationService } from '../../services/navigation.service';
import {FactorParentOverlayRef} from "../factor-parent-overlay/factor-parent-overlay-ref";
import {FactorParentOverlayService} from "../factor-parent-overlay/factor-parent-overlay.service";

declare const CryptoCore: any;
declare const Buffer: any;

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
export class RegistrationComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild(FactorParentOverlayRef) child;
  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  private subscriptions = [];

  stPassword = 'Password';
  stRegistration = 'Sign up';
  username: string = null;
  stWarning =
    'Your funds safety depends on the strongness of the authentication factors. ' +
    'Later you can add alternative authentication paths, however it is impossible to remove or alter existing paths.';
  password = '';
  advancedMode = false;

  factors = [];

  uploading = false;

  cancel = new Subject<boolean>();

  constructor(
    public dialog: MatDialog,
    public factorParentDialog: FactorParentOverlayService,
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly notification: NotificationService,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService
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
    this.goBottom();

    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  addNewFactor() {
    this.authService.password = this.password;
    const dialogFactorRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { isColored: false, isShadowed: false }
    });

    dialogFactorRef.componentInstance.onAddFactor.subscribe((result) => {
      this.addFactor(result);
    });

    dialogFactorRef.afterClosed().subscribe(result => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
      this.openFactorOverlay(result);
    });
  }

  async openFactorOverlay(component) {
    this.child = this.factorParentDialog.open({
      label: '',
      isColored: false,
      isShadowed: false,
      content: component
    });

    this.child.onAddFactor.subscribe((result) => {
      this.addFactor(result);
      this.child.close();
    });
  }

  removeFactor(factor): void {
    this.authService.rmFactor(factor);
    this.factors = this.authService.factors;
    this.changeDetectorRef.detectChanges();
  }

  async addFactor(result) {
    try {
      await this.authService.addFactor(result.factor, result.value);
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
    await this.router.navigate(['/login']);
  }

  async signUp() {
    try {
      this.uploading = true;

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

      const id = await AuthService.toId(this.authService.login);
      const data = await CryptoCore.Utils.packTree(tree, this.keychain.getSeed());

      try {
        const success = await this.dds.sponsorStore(id, data).take(1).takeUntil(this.cancel).toPromise();
        if (!success) {
          return;
        }

        this.authService.clearFactors();
        this.authService.password = '';
        this.factors = [];
        this.password = '';

        await this.router.navigate(['/reg-success']);
      } catch (ignored) {
        this.notification.show('Failed to upload the secret');
      }
    } finally {
      this.uploading = false;
    }
  }
}
