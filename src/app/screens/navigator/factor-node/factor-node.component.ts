import {
  Component,
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
import * as $ from 'jquery';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { take, takeUntil, map } from 'rxjs/operators';
import { DialogFactorsComponent } from '../../../modals/dialog-factors/dialog-factors.component';
import { AuthService, AuthFactor, IdFactor } from '../../../services/auth.service';
import { DDSService } from '../../../services/dds.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NavigationService, Position } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WorkerService } from '../../../services/worker.service';

import { packLogin, tryUnpackLogin, packTree, randomBytes } from 'crypto-core-async/lib/utils';
import { toBehaviourSubject } from '../../../utils/transformers';
import { LoginFactorComponent } from '../../identification-factors/login-factor/login-factor.component';
import { QrFactorComponent } from '../../identification-factors/qr-factor/qr-factor.component';
import { NfcFactorComponent } from '../../identification-factors/nfc-factor/nfc-factor.component';
import { PasswordAuthFactorComponent } from '../../authorization-factors/password-auth-factor/password-auth-factor.component';
import { PincodeAuthFactorComponent } from '../../authorization-factors/pincode-auth-factor/pincode-auth-factor.component';
import { GraphicKeyAuthFactorComponent } from '../../authorization-factors/graphic-key-auth-factor/graphic-key-auth-factor.component';
import { FileAuthFactorComponent } from '../../authorization-factors/file-auth-factor/file-auth-factor.component';
import { QrAuthFactorComponent } from '../../authorization-factors/qr-auth-factor/qr-auth-factor.component';
import { NfcAuthFactorComponent } from '../../authorization-factors/nfc-auth-factor/nfc-auth-factor.component';
import { catchError, mapTo } from 'rxjs/internal/operators';
import { BackupComponent } from '../../backup/backup.component';

@Component({
  selector: 'app-factor-node',
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
  templateUrl: './factor-node.component.html',
  styleUrls: ['./factor-node.component.css']
})
export class FactorNodeComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';
  @ViewChild('factorContainer') factorContainer: ElementRef;

  public idFactor = new BehaviorSubject<any>(null);
  public idFactorItem = toBehaviourSubject(this.idFactor.pipe(
    map(factor => {
      if (!factor) {
        return null;
      }

      const entry = this.authService.getIdFactors(false, true).get(factor.type as IdFactor);
      return {
        icon: entry.icon,
        icon_asset: entry.icon_asset
      };
    })), null);

  public factors = new BehaviorSubject<Array<any>>([]);
  public factorItems = [];

  public uploading = false;
  private cancel = new Subject<boolean>();

  private subscriptions = [];

  constructor(
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) {}

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  public onAdd() {
    if (this.idFactor.getValue()) {
      this.openFactorDialog();
    } else {
      this.openIdFactorDialog();
    }
  }

  public openIdFactorDialog() {
    const componentRef = this.navigationService.pushOverlay(DialogFactorsComponent, Position.Center);
    componentRef.instance.factors = Array.from(this.authService.getIdFactors(false, true).values());

    componentRef.instance.selected.subscribe(result => {
      this.navigationService.acceptOverlay();

      this.openIdFactorOverlay(result);
    });
  }

  public openIdFactorOverlay(type: IdFactor) {
    switch (type) {
      case IdFactor.Login:
        return this.openIdFactorOverlayOfType(LoginFactorComponent);
      case IdFactor.QR:
        return this.openIdFactorOverlayOfType(QrFactorComponent);
      case IdFactor.NFC:
        return this.openIdFactorOverlayOfType(NfcFactorComponent);
    }
  }

  public openIdFactorOverlayOfType(componentType) {
    const componentRef = this.navigationService.pushOverlay(componentType);

    componentRef.instance.submit.subscribe(async factor => {
      this.navigationService.acceptOverlay();
      await this.setIdFactor(factor);
    });
  }

  public setIdFactor(factor) {
    this.idFactor.next(factor);

    this.factors.next([]);
    this.factorItems = [];
  }

  public openFactorDialog() {
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

  private openFactorOverlayOfType(componentType) {
    const componentRef = this.navigationService.pushOverlay(componentType);

    componentRef.instance.submit.subscribe(async (factor) => {
      this.navigationService.acceptOverlay();
      await this.addFactor(factor);
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

  public openBackupOverlay(id, data) {
    const componentRef = this.navigationService.pushOverlay(BackupComponent);

    componentRef.instance.id = id;
    componentRef.instance.data = data;

    componentRef.instance.success.subscribe(async () => {
      // accept the backup overlay
      this.navigationService.acceptOverlay();

      // and then accept this one
      this.navigationService.acceptOverlay();

      this.notification.show('Successfully uploaded the secret');
    });
  }

  async onSave() {
    try {
      this.uploading = true;

      const seed = this.keychain.getSeed();

      const factors = this.factors.getValue();

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

      const idFactor = this.idFactor.getValue();
      const login = idFactor.type === IdFactor.Login
                  ? idFactor.value.toLowerCase()
                  : idFactor.value;

      const id = await this.authService.toId(login);
      const data = await packTree(tree, seed, this.workerService.worker);

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
        // accept this overlay
        this.navigationService.acceptOverlay();
        this.notification.show('Successfully uploaded the secret');
      }
    } catch (ignored) {
      this.notification.show('Registration error');
    } finally {
      this.uploading = false;
    }
  }

  async onBack() {
    this.cancel.next(true);
    this.navigationService.back();
  }
}
