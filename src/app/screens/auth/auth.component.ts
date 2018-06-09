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
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import * as $ from 'jquery';
import { DialogFactorsComponent } from '../../modals/dialog-factors/dialog-factors.component';
import { AuthFactor, AuthService, IdFactor } from '../../services/auth.service';
import { KeyChainService } from '../../services/keychain.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';
import { DDSService } from '../../services/dds.service';
import { BehaviorSubject } from "rxjs/index";
import { PasswordAuthFactorComponent } from "../authorization-factors/password-auth-factor/password-auth-factor.component";
import { PincodeAuthFactorComponent } from "../authorization-factors/pincode-auth-factor/pincode-auth-factor.component";
import { GraphicKeyAuthFactorComponent } from "../authorization-factors/graphic-key-auth-factor/graphic-key-auth-factor.component";
import { FileAuthFactorComponent } from "../authorization-factors/file-auth-factor/file-auth-factor.component";
import { QrAuthFactorComponent } from "../authorization-factors/qr-auth-factor/qr-auth-factor.component";
import { NfcAuthFactorComponent } from "../authorization-factors/nfc-auth-factor/nfc-auth-factor.component";
import { toBehaviourSubject } from "../../utils/transformers";
import { map } from "rxjs/operators";
import { DefaultAuthFactorComponent } from "../authorization-factors/default-auth-factor/default-auth-factor.component";

export enum State {
  Loading,
  Decryption,
  Ready,
  Error
}

@Component({
  selector: 'app-auth',
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
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  public login = null;
  public type = IdFactor.Login;
  public loginType = IdFactor;

  public stateType = State;
  public state = State.Loading;

  public busy = false;
  public advanced = false;

  public factors = new BehaviorSubject<Array<any>>([]);
  public factorItems = toBehaviourSubject(this.factors.pipe(
    map(factors => factors.map(factor => {
      const entry = this.authService.authFactors.get(factor.type as AuthFactor);
      return {
        icon: entry.icon,
        icon_asset: entry.icon_asset
      }
    }))), []);

  public isAdvanced = false;

  private decryptedSeed = null;
  private remoteEncryptedTrees = [];

  private factorDialog = null;

  private subscriptions = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly notification: NotificationService,
    private readonly keyChain: KeyChainService,
    private readonly navigationService: NavigationService,
    private readonly dds: DDSService
  ) {
    this.subscriptions.push(
      activatedRoute.paramMap.subscribe(async params => {
        this.type = Number(params.get('type')) as IdFactor;
        this.login = params.get('login');

        await this.fetchData(this.type, this.login);
      })
    );

    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
  }

  async fetchData(type, login) {
    try {
      this.state = State.Loading;

      const id = await this.authService.toId(type === IdFactor.Login ? login.toLowerCase() : login);

      this.remoteEncryptedTrees = [ await this.dds.read(id) ];

      this.state = State.Decryption;

      if (type !== IdFactor.Login) {
        this.openFactorDialog();
      } else {
        this.opendDefaultFactorOverlay();
      }
    } catch (e) {
      this.state = State.Error;
      this.notification.show('Failed to fetch an authorization tree from the storage.')
    }
  }

  async retry() {
    await this.fetchData(this.type, this.login);
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

  openFactorDialog() {
    if (this.factorDialog) {
      return;
    }

    this.factorDialog = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: Array.from(this.authService.authFactors.values())
    });

    this.factorDialog.afterClosed().subscribe(async result => {
      this.factorDialog = null;
      if (typeof result !== 'undefined') {
        await this.openFactorOverlay(result);
      }
    });
  }

  public opendDefaultFactorOverlay() {
    const componentRef = this.navigationService.pushOverlay(DefaultAuthFactorComponent);

    componentRef.instance.advanced.subscribe(() => {
      this.advanced = true;
    });
    componentRef.instance.cancelled.subscribe(() => {
      this.advanced = true;
    });
    componentRef.instance.submit.subscribe(async factor => {
      this.navigationService.acceptOverlay();
      await this.addFactor(factor);
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

    componentRef.instance.submit.subscribe(async factor => {
      this.navigationService.acceptOverlay();
      await this.addFactor(factor);
    });
  }

  async addFactor(factor) {
    try {
      this.busy = true;

      const result = await this.authService.tryDecryptWith(this.remoteEncryptedTrees, factor);

      if (result.success) {
        const factors = this.factors.getValue();

        factors.push(factor);

        this.factors.next(factors);

        this.goBottom();

        if (result.seed) {
          this.decryptedSeed = result.seed;
          this.state = State.Ready;
        }
      } else {
        throw new Error('Unknown error');
      }
    } catch(e) {
      if (this.type === IdFactor.Login && !this.advanced && this.factors.getValue().length === 0) {
        this.opendDefaultFactorOverlay();
      }
      this.notification.show('Failed to decrypt secret with this factor');
    } finally {
      this.busy = false;
    }
  }

  removeFactor(index) {
    this.factors.next(this.factors.getValue().slice(0, index));

    this.remoteEncryptedTrees = this.remoteEncryptedTrees.slice(0, index + 1);

    this.advanced = true;

    if (this.decryptedSeed) {
      this.decryptedSeed = null;
      this.state = State.Decryption;
    }
  }

  async signIn() {
    if (!this.decryptedSeed) {
      this.notification.show('Authorization error');
      return;
    }

    this.keyChain.setSeed(this.decryptedSeed);

    await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
  }

  async onBackClicked() {
    if (this.factorDialog) {
      this.factorDialog.close();
      this.factorDialog = null;
    } else {
      await this.router.navigate(['/login']);
    }
  }
}
