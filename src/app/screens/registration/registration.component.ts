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

import { BehaviorSubject, of, Subject } from 'rxjs';
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

import { randomBytes } from 'crypto-core-async/lib/utils';
import { RegistrationSuccessComponent } from "../registration-success/registration-success.component";
import { BackupComponent } from "../backup/backup.component";
import { catchError, mapTo } from "rxjs/internal/operators";

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

  private factorDialog = null;
  private factorOverlay = null;
  private backupOverlay = null;
  private successOverlay = null;

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

    if (this.backupOverlay) {
      this.backupOverlay.dismiss();
      this.backupOverlay = null;
    }

    if (this.successOverlay) {
      this.successOverlay.dismiss();
      this.successOverlay = null;
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

  public openBackupOverlay(id, data) {
    if (this.backupOverlay) {
      return;
    }

    const config = new OverlayConfig();

    config.height = '100%';
    config.width = '100%';

    this.backupOverlay = this.overlay.create(config);
    const portal = new ComponentPortal<BackupComponent>(BackupComponent);
    const componentRef: ComponentRef<BackupComponent> = this.backupOverlay.attach(portal);

    componentRef.instance.id = id;
    componentRef.instance.data = data;

    componentRef.instance.back.subscribe(() => {
      this.backupOverlay.dispose();
      this.backupOverlay = null;
    });
    componentRef.instance.success.subscribe(async () => {
      this.backupOverlay.dispose();
      this.backupOverlay = null;

      this.openSuccessOverlay();

      this.notification.show('Successfully uploaded the secret');
    });
  }

  public openSuccessOverlay() {
    if (this.successOverlay) {
      return;
    }

    const config = new OverlayConfig();

    config.height = '100%';
    config.width = '100%';

    this.successOverlay = this.overlay.create(config);
    const portal = new ComponentPortal<RegistrationSuccessComponent>(RegistrationSuccessComponent);
    const componentRef: ComponentRef<RegistrationSuccessComponent> = this.successOverlay.attach(portal);

    componentRef.instance.back.subscribe(async () => {
      this.successOverlay.dispose();
      this.successOverlay = null;

      await this.router.navigate(['/start']);
    });
    componentRef.instance.submit.subscribe(async () => {
      this.successOverlay.dispose();
      this.successOverlay = null;

      this.keychain.setSeed(this.seed);

      await this.router.navigate(['/navigator', {outlets: {navigator: ['waiting']}}]);
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
    if (this.backupOverlay) {
      this.backupOverlay.dispose();
      this.backupOverlay = null;
    } else if (this.successOverlay) {
      this.successOverlay.dispose();
      this.successOverlay = null;
    } else if (this.factorOverlay) {
      this.factorOverlay.dispose();
      this.factorOverlay = null;
    } else if (this.factorDialog) {
      this.factorDialog.close();
      this.factorDialog = null;
    } else {
      this.cancel.next(true);
      await this.router.navigate(['/login']);
    }
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
        mapTo({ success: true }),
        catchError(error => of({ success: false }))
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
    } catch (e) {
      this.notification.show('Registration error');
    } finally {
      this.uploading = false;
    }
  }
}
