import {
  AfterViewInit, animate, ChangeDetectorRef, Component, ElementRef, HostBinding, OnDestroy, OnInit, sequence, style,
  transition,
  trigger, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogFactorsComponent } from '../../dialog-factors/dialog-factors.component';
import { KeyChainService } from '../../../services/keychain.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import * as $ from 'jquery';
import { DDSService } from '../../../services/dds.service';
import { NotificationService } from '../../../services/notification.service';
import { Subject } from 'rxjs/Subject';
import { NavigationService } from '../../../services/navigation.service';
import {FactorParentOverlayService} from '../../factor-parent-overlay/factor-parent-overlay.service';
import {QrWriterComponent} from '../../factors/qr-writer/qr-writer.component';
import {FactorParentOverlayRef} from '../../factor-parent-overlay/factor-parent-overlay-ref';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

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

  async generateQrLogin() {
    try {
      do {
        const login = this.authService.makeNewLogin(10);
        const exists = await this.dds.exists(await AuthService.toId(login));
        if (!exists) {
          const packedLogin = await CryptoCore.Utils.packLogin(login);
          this.value.next(await packedLogin.toString('hex'));
          console.log('qwe');
          break;
        }
      } while (true);
    } catch (ignored) {
      console.log(ignored);
      this.notification.show('No network connection');
    }
  }

  addNewFactor() {
    const isAuth = this.factors.length === 0;
    let label = 'Authorization factor';
    if (isAuth) {
      label = 'Identification factor';
    }
    const dialogRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { isAuth: isAuth, label: label, isColored: true, isShadowed: true },
    });

    dialogRef.componentInstance.onAddFactor.subscribe((result) => {
      this.addFactor(result);
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
      this.openOverlay(label, result);
    });
  }

  async openOverlay(label, component) {
    if (component === QrWriterComponent) {
      this.generateQrLogin().catch(() => {});
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
    });

    this.child.value = this.value;

    console.log(this.child);
  }

  async addFactor(result) {
    try {
      this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
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
    await this.router.navigate(['/navigator', { outlets: { navigator: ['settings'] } }]);
  }
}
