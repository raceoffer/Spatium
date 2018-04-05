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
  private subscriptions = [];

  title = 'Adding authentication path';
  factors = [];

  uploading = false;

  cancel = new Subject<boolean>();

  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  constructor(
    public  dialog: MatDialog,
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly authSevice: AuthService,
    private readonly navigationService: NavigationService
  ) {  }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    this.factors = this.authSevice.factors;

    $('#factorContainer').scroll(function () {

      if ($(this).scrollTop() > 0) {
        $('#top-scroller').fadeIn();
      } else {
        $('#top-scroller').fadeOut();
      }

      if ($(this).scrollTop() <  ($(this)[0].scrollHeight - $(this).height()) ) {
        $('#bottom-scroller').fadeIn();
      } else {
        $('#bottom-scroller').fadeOut();
      }
    });
  }

  ngAfterViewInit() {
    this.checkOverflow(this.factorContainer);
    this.goBottom();

    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  checkOverflow (element) {
    if (element.nativeElement.offsetHeight < element.nativeElement.scrollHeight) {
      $('#bottom-scroller').fadeIn();
    } else {
      $('#bottom-scroller').fadeOut();
    }
  }

  goTop() {
    const container = $('#factor-container');
    container.animate({scrollTop: 0}, 500, 'swing');
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  addNewFactor() {
    const isFirst = this.factors.length === 0;
    const dialogRef = this.dialog.open(DialogFactorsComponent, {
      width: '250px',
      data: { back: 'factornode', next: 'factornode', isFirst: isFirst }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.dialogButton._elementRef.nativeElement.classList.remove('cdk-program-focused');
    });
  }

  async removeFactor(factor) {
    this.authSevice.rmFactorWithChildren(factor);
    this.factors = this.authSevice.factors;
    this.changeDetectorRef.detectChanges();

    this.sleep(650).then(function() {
      this.checkOverflow(this.factorContainer);
    }.bind(this));
  }

  async sleep(ms: number) {
    await this._sleep(ms);
  }

  _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onSaveClicked() {
    try {
      this.uploading = true;

      const idFactor = this.factors[0].value;
      const factors = this.factors.slice(1).map(factor => factor.toBuffer()).reverse();
      const tree = factors.reduce((rest, factor) => {
        const node = {
          factor: factor
        };
        if (rest) {
          node['children'] = [rest];
        }
        return node;
      }, null);

      const login = await CryptoCore.Utils.tryUnpackLogin(idFactor).toString('utf-8');

      const id = (await CryptoCore.Utils.sha256(Buffer.from(login, 'utf-8'))).toString('hex');
      const data = await CryptoCore.Utils.packTree(tree, this.keychain.getSeed());

      try {
        const success = await this.dds.sponsorStore(id, data).take(1).takeUntil(this.cancel).toPromise();
        if (!success) {
          return;
        }

        this.authSevice.clearFactors();
        this.authSevice.password = '';
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
