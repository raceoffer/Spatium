import {
  AfterViewInit, animate, ChangeDetectorRef, Component, ElementRef, HostBinding, OnDestroy, OnInit, sequence, style,
  transition,
  trigger, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../../../modals/dialog-factors/dialog-factors.component';
import { KeyChainService } from '../../../services/keychain.service';
import {AuthService, FactorType} from '../../../services/auth.service';
import { Router } from '@angular/router';
import * as $ from 'jquery';
import { DDSService } from '../../../services/dds.service';
import { NotificationService } from '../../../services/notification.service';
import { Subject } from 'rxjs/Subject';
import { NavigationService } from '../../../services/navigation.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { QrWriterComponent } from '../../factors/qr-writer/qr-writer.component';
import { NfcWriterComponent } from '../../factors/nfc-writer/nfc-writer.component';
import { FactorParentOverlayRef } from '../../../modals/factor-parent-overlay/factor-parent-overlay-ref';
import { FactorParentOverlayService } from '../../../modals/factor-parent-overlay/factor-parent-overlay.service';

declare const CryptoCore: any;
declare const Buffer: any;

@Component({
  selector: 'app-factor-node',
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
  templateUrl: './factor-node.component.html',
  styleUrls: ['./factor-node.component.css']
})
export class FactorNodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild(FactorParentOverlayRef) child;
  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  public value: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private subscriptions = [];

  title = 'Adding authorization path';
  factors = [];
  uploading = false;
  cancel = new Subject<boolean>();
  isAuth = false;
  dialogFactorRef = null;

  constructor(
    public dialog: MatDialog,
    public factorParentDialog: FactorParentOverlayService,
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService
  ) {  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.factors = this.authService.factors;
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

  async generateLogin(isQr) {
    try {
      do {
        const login = this.authService.makeNewLogin(10);
        const exists = await this.dds.exists(await AuthService.toId(login));
        if (!exists) {
          const packedLogin = await CryptoCore.Utils.packLogin(login);
          if (isQr) {
            this.value.next(await packedLogin.toString('hex'));
          } else {
            this.value.next(packedLogin);
          }
          break;
        }
      } while (true);
    } catch (ignored) {
      console.log(ignored);
      this.notification.show('No network connection');
    }
  }

  addNewFactor() {
    this.isAuth = this.factors.length === 0;
    let label = 'Authorization factor';
    if (this.isAuth) {
      label = 'Identification factor';
    }
    this.dialogFactorRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { isAuth: this.isAuth, label: label, isColored: true, isShadowed: true },
    });

    this.dialogFactorRef.componentInstance.goToFactor.subscribe((result) => {
      this.openFactorOverlay(label, result);
    });

    this.dialogFactorRef.afterClosed().subscribe(() => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
      this.dialogFactorRef = null;
    });
  }

  async openFactorOverlay(label, component) {
    if (typeof component !== 'undefined') {
      if (component === QrWriterComponent) {
        this.generateLogin(true).catch(() => {});
      } else if (component === NfcWriterComponent) {
        this.generateLogin(false).catch(() => {});
      }

      this.child = this.factorParentDialog.open({
        label: label,
        isColored: true,
        isShadowed: true,
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

      this.child.value = this.value;

      console.log(this.child);
    }
  }

  async addFactor(result) {
    try {
      switch (result.factor) {
        case FactorType.QR: {
          if (this.isAuth) {
            await this.authService.addFactor(result.factor, Buffer.from(result.value, 'hex'));
          } else {
            await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
          }
          break;
        }
        case FactorType.NFC: {
          if (this.isAuth) {
            await this.authService.addFactor(result.factor, await CryptoCore.Utils.packLogin(result.value));
          } else {
            await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
          }
          break;
        }
        default: {
          await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
        }
      }
      this.goBottom();
    } catch (e) {
      console.log(e);
    }
  }

  async removeFactor(factor) {
    this.authService.rmFactorWithChildren(factor);
    this.factors = this.authService.factors;
    this.changeDetectorRef.detectChanges();
  }

  async onSaveClicked() {
    try {
      this.uploading = true;

      const idFactor = this.factors[0].value;

      let factors = [];
      for (let i = 1; i < this.factors.length; ++i) {
        factors.push(await this.factors[i].toBuffer());
      }

      factors = factors.reverse();

      const tree = factors.reduce((rest, factor) => {
        const node = {
          factor: factor
        };
        if (rest) {
          node['children'] = [rest];
        }
        return node;
      }, null);

      const login = (await CryptoCore.Utils.tryUnpackLogin(idFactor)).toString('utf-8');

      const id = await AuthService.toId(login);
      const data = await CryptoCore.Utils.packTree(tree, this.keychain.getSeed());

      try {
        const success = await this.dds.sponsorStore(id, data).take(1).takeUntil(this.cancel).toPromise();
        if (!success) {
          return;
        }

        this.authService.clearFactors();
        this.authService.password = '';
        this.factors = [];

        this.notification.show('Successfully uploaded the secret');
        await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
      } catch (ignored) {
        this.notification.show('Failed to upload the secret');
      }
    } finally {
      this.uploading = false;
    }
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
      await this.router.navigate(['/navigator', {outlets: {navigator: ['settings']}}]);
    }
  }
}
