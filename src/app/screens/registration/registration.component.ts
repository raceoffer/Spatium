import { animate, sequence, style, transition, trigger, } from '@angular/animations';
import { Component, ElementRef, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { packTree, randomBytes } from 'crypto-core-async/lib/utils';
import * as $ from 'jquery';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, mapTo } from 'rxjs/internal/operators';
import { take, takeUntil } from 'rxjs/operators';
import { DialogFactorsComponent } from '../../modals/dialog-factors/dialog-factors.component';
import { AuthFactor, AuthService } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { DeviceService, Platform } from '../../services/device.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService, Position } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';
import { FileAuthFactorComponent } from '../authorization-factors/file-auth-factor/file-auth-factor.component';
import { GraphicKeyAuthFactorComponent } from '../authorization-factors/graphic-key-auth-factor/graphic-key-auth-factor.component';
import { NfcAuthFactorComponent } from '../authorization-factors/nfc-auth-factor/nfc-auth-factor.component';
import { PasswordAuthFactorComponent } from '../authorization-factors/password-auth-factor/password-auth-factor.component';
import { PincodeAuthFactorComponent } from '../authorization-factors/pincode-auth-factor/pincode-auth-factor.component';
import { QrAuthFactorComponent } from '../authorization-factors/qr-auth-factor/qr-auth-factor.component';
import { BackupComponent } from '../backup/backup.component';
import { RegistrationSuccessComponent } from '../registration-success/registration-success.component';

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
export class RegistrationComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild('factorContainer') factorContainer: ElementRef;

  public advanced = false;
  public login: string = null;
  public seed: any = null;

  public factors = new BehaviorSubject<Array<any>>([]);
  public factorItems = [];

  public password = '';
  public passwordClass = this.isWindows() ? 'caret-center' : '';
  public confirmPassword = '';
  public confirmPasswordClass = this.isWindows() ? 'caret-center' : '';

  stWarning =
    'Your funds safety depends on the strongness of the authorization factors. ' +
    'Later you can add alternative authorization paths, however it is impossible to remove or alter existing paths.';

  public uploading = false;
  private cancel = new Subject<boolean>();

  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly activatedRoute: ActivatedRoute,
              private readonly dds: DDSService,
              private readonly keychain: KeyChainService,
              private readonly notification: NotificationService,
              private readonly authService: AuthService,
              private readonly navigationService: NavigationService,
              private readonly workerService: WorkerService,
              private readonly deviceService: DeviceService) {
    this.subscriptions.push(
      activatedRoute.paramMap.subscribe(async params => {
        this.login = params.get('login');
      })
    );

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onPasswordChange(newValue) {
    if (!newValue) {
      if (this.isWindows()) {
        this.passwordClass = 'caret-center';
      }
      this.password = '';
    } else {
      this.passwordClass = '';
      this.password = newValue;
    }
  }

  onConfirmPasswordChange(newValue) {
    if (!newValue) {
      if (this.isWindows()) {
        this.confirmPasswordClass = 'caret-center';
      }
      this.confirmPassword = '';
    } else {
      this.confirmPasswordClass = '';
      this.confirmPassword = newValue;
    }
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  openFactorDialog() {
    const componentRef = this.navigationService.pushOverlay(DialogFactorsComponent, Position.Center);
    componentRef.instance.factors = Array.from(this.authService.getAuthFactors(true, true).values());

    componentRef.instance.selected.subscribe(result => {
      this.navigationService.acceptOverlay();

      this.openFactorOverlay(result);
    });
  }

  public openFactorOverlay(type: AuthFactor) {
    switch (type) {
      case AuthFactor.Password:
        return this.openFactorOverlayOfType(PasswordAuthFactorComponent);
      case AuthFactor.Pincode:
        return this.openFactorOverlayOfType(PincodeAuthFactorComponent);
      case AuthFactor.GraphicKey:
        return this.openFactorOverlayOfType(GraphicKeyAuthFactorComponent);
      case AuthFactor.File:
        return this.openFactorOverlayOfType(FileAuthFactorComponent);
      case AuthFactor.QR:
        return this.openFactorOverlayOfType(QrAuthFactorComponent);
      case AuthFactor.NFC:
        return this.openFactorOverlayOfType(NfcAuthFactorComponent);
    }
  }

  public openBackupOverlay(id, data) {
    const componentRef = this.navigationService.pushOverlay(BackupComponent);

    componentRef.instance.id = id;
    componentRef.instance.data = data;

    componentRef.instance.success.subscribe(async () => {
      this.navigationService.acceptOverlay();

      this.openSuccessOverlay();

      this.notification.show('Successfully uploaded the secret');
    });
  }

  public openSuccessOverlay() {
    const componentRef = this.navigationService.pushOverlay(RegistrationSuccessComponent);

    componentRef.instance.cancelled.subscribe(async () => {
      await this.router.navigate(['/start']);
    });
    componentRef.instance.submit.subscribe(async () => {
      this.navigationService.acceptOverlay();

      this.keychain.setSeed(this.seed);

      await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
    });
  }

  removeFactor(index) {
    const factors = this.factors.getValue();

    factors.splice(index, 1);

    this.factors.next(factors);
    this.factorItems.splice(index, 1);
  }

  addFactor(factor) {
    const factors = this.factors.getValue();

    factors.push(factor);

    this.factors.next(factors);

    const entry = this.authService.getAuthFactors(true, true).get(factor.type as AuthFactor);
    this.factorItems.push({
      icon: entry.icon,
      icon_asset: entry.icon_asset
    });

    this.goBottom();
  }

  openAdvanced() {
    this.advanced = true;
  }

  async onBackClicked() {
    this.cancel.next(true);
    await this.router.navigate(['/login']);
  }

  async signUp() {
    try {
      this.uploading = true;

      this.seed = await randomBytes(64, this.workerService.worker);

      const factors = [{
        type: AuthFactor.Password,
        value: Buffer.from(this.password, 'utf-8')
      }].concat(this.factors.getValue());

      const packed = [];
      for (const factor of factors) {
        packed.push(await this.authService.pack(factor.type, factor.value));
      }

      const reversed = packed.reverse();

      const tree = reversed.reduce((rest, factor) => {
        const node = {
          factor: factor
        };
        if (rest) {
          node['children'] = [rest];
        }
        return node;
      }, null);

      const id = await this.authService.toId(this.login.toLowerCase());
      const data = await packTree(tree, this.seed, this.workerService.worker);

      const result = await this.dds.sponsorStore(id, data).pipe(
        take(1),
        takeUntil(this.cancel),
        mapTo({success: true}),
        catchError(error => of({success: false}))
      ).toPromise();

      if (!result) {
        // that means cancelled
        return;
      } else if (result.success === false) {
        await this.openBackupOverlay(id, data);
        this.notification.show('Failed to save registration data to the storage. You can perform registration manually');
      } else if (result.success === true) {
        await this.openSuccessOverlay();
        this.notification.show('Successfully uploaded the secret');
      }
    } catch (ignored) {
      this.notification.show('Registration error');
    } finally {
      this.uploading = false;
    }
  }

  isWindows(): boolean {
    return this.deviceService.platform === Platform.Windows;
  }

  private openFactorOverlayOfType(componentType) {
    const componentRef = this.navigationService.pushOverlay(componentType);

    componentRef.instance.submit.subscribe(async (factor) => {
      this.navigationService.acceptOverlay();
      await this.addFactor(factor);
    });
  }
}
