import {
  Component, ComponentRef,
  ElementRef,
  HostBinding,
  OnDestroy,
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
import { ActivatedRoute, Router } from '@angular/router';
import * as $ from 'jquery';

import { BehaviorSubject, Subject } from 'rxjs';
import { take, takeUntil, map } from 'rxjs/operators';
import { DialogFactorsComponent } from '../../modals/dialog-factors/dialog-factors.component';
import { AuthService, AuthFactor, Factor } from '../../services/auth.service';
import { DDSService } from '../../services/dds.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { WorkerService } from '../../services/worker.service';
import { AuthFactor as AuthFactorInterfce } from "../authorization-factors/auth-factor";

import { packTree } from 'crypto-core-async/lib/utils';
import { toBehaviourSubject } from "../../utils/transformers";
import { ComponentPortal } from "@angular/cdk/portal";
import { Overlay, OverlayConfig } from "@angular/cdk/overlay";
import { PasswordAuthFactorComponent } from "../authorization-factors/password-auth-factor/password-auth-factor.component";
import { PincodeAuthFactorComponent } from "../authorization-factors/pincode-auth-factor/pincode-auth-factor.component";
import { GraphicKeyAuthFactorComponent } from '../authorization-factors/graphic-key-auth-factor/graphic-key-auth-factor.component';
import { FileAuthFactorComponent } from "../authorization-factors/file-auth-factor/file-auth-factor.component";
import { QrAuthFactorComponent } from "../authorization-factors/qr-auth-factor/qr-auth-factor.component";
import { NfcAuthFactorComponent } from "../authorization-factors/nfc-auth-factor/nfc-auth-factor.component";

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

  public factors = new BehaviorSubject<Array<Factor>>([]);
  public factorItems = toBehaviourSubject(this.factors.pipe(
    map(factors => factors.map(factor => {
      const entry = this.authService.authFactors.get(factor.type as AuthFactor);
      return {
        icon: entry.icon,
        icon_asset: entry.icon_asset
      }
    }))), []);

  public password = '';
  public confirmPassword = '';

  stWarning =
    'Your funds safety depends on the strongness of the authentication factors. ' +
    'Later you can add alternative authentication paths, however it is impossible to remove or alter existing paths.';

  uploading = false;
  cancel = new Subject<boolean>();

  factorDialog = null;
  factorOverlay = null;

  private subscriptions = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly overlay: Overlay,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly dds: DDSService,
    private readonly keychain: KeyChainService,
    private readonly notification: NotificationService,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) {
    this.subscriptions.push(
      activatedRoute.paramMap.subscribe(async params => {
        this.login = params.get('login');

        // this.keychain.setSeed(await randomBytes(64, this.workerService.worker));
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

    if (this.factorDialog) {
      this.factorDialog.close();
      this.factorDialog = null;
    }

    if (this.factorOverlay) {
      this.factorOverlay.dismiss();
      this.factorOverlay = null;
    }
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  openFactorDialog() {
    if (this.factorDialog) {
      return;
    }

    this.factorDialog = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: Array.from(this.authService.authFactors.values())
    });

    this.factorDialog.afterClosed().subscribe(async result => {
      await this.openFactorOverlay(result);
      this.factorDialog = null;
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

  private openFactorOverlayOfType(componentType) {
    if (this.factorOverlay) {
      return;
    }

    const config = new OverlayConfig();

    config.height = '100%';
    config.width = '100%';

    this.factorOverlay = this.overlay.create(config);
    const portal = new ComponentPortal<AuthFactorInterfce>(componentType);
    const componentRef: ComponentRef<AuthFactorInterfce> = this.factorOverlay.attach(portal);

    componentRef.instance.back.subscribe(() => {
      this.factorOverlay.dispose();
      this.factorOverlay = null;

      this.advanced = true;
    });
    componentRef.instance.submit.subscribe(async (factor) => {
      this.factorOverlay.dispose();
      this.factorOverlay = null;

      await this.addFactor(factor);
    });
  }

  removeFactor(index){
    this.factors.next(this.factors.getValue().slice(0, index));
  }

  addFactor(factor) {
    const factors = this.factors.getValue();

    factors.push(factor);

    this.factors.next(factors);
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
    // try {
    //   this.uploading = true;
    //
    //   if (!this.passwordsIsMatching()) {
    //     throw {
    //       message: 'Passwords do not match. Please try again.',
    //       name: 'PassNotMatch'
    //     };
    //   }
    //
    //   let factors = [];
    //   for (let i = 0; i < this.factors.length; ++i) {
    //     factors.push(await this.factors[i].toBuffer());
    //   }
    //
    //   factors = factors.reverse();
    //
    //   //factors.push(await this.authService.newFactor(FactorType.PASSWORD, Buffer.from(this.password, 'utf-8')).toBuffer());
    //
    //   const tree = factors.reduce((rest, factor) => {
    //     const node = {
    //       factor: factor
    //     };
    //     if (rest) {
    //       node['children'] = [rest];
    //     }
    //     return node;
    //   }, null);
    //
    //  // const id = await this.authService.toId(this.authService.login.toLowerCase());
    //   //console.log(`RegistrationComponent.signUp: this.authService.login=${this.authService.login.toLowerCase()}`);
    //  // const data = await packTree(tree, this.keychain.getSeed(), this.workerService.worker);
    //   //this.authService.currentTree = data;
    //   //
    //   // try {
    //   //   const success = await this.dds.sponsorStore(id, data).pipe(take(1), takeUntil(this.cancel)).toPromise();
    //   //   if (!success) {
    //   //     await this.router.navigate(['/backup', { back: 'registration'}]);
    //   //     return;
    //   //   }
    //   //
    //   //   this.authService.clearFactors();
    //   //   this.authService.password = '';
    //   //   this.authService.currentTree = null;
    //   //   this.factors = [];
    //   //   this.password = '';
    //   //
    //   //   await this.router.navigate(['/reg-success']);
    //   // } catch (ignored) {
    //   //   await this.router.navigate(['/backup', { back: 'registration'}]);
    //   // }
    // } catch (e) {
    //   this.notification.show(e.message);
    // } finally {
    //   this.uploading = false;
    // }
  }
}
