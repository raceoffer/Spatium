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
import { BehaviorSubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DialogFactorsComponent } from '../../../modals/dialog-factors/dialog-factors.component';
import { AuthService, AuthFactor } from '../../../services/auth.service';
import { DDSService } from '../../../services/dds.service';
import { KeyChainService } from '../../../services/keychain.service';
import { NavigationService } from '../../../services/navigation.service';
import { NotificationService } from '../../../services/notification.service';
import { WorkerService } from '../../../services/worker.service';
import { randomBytes } from 'crypto-core-async/lib/utils';


import { packLogin, tryUnpackLogin, packTree } from 'crypto-core-async/lib/utils';

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
export class FactorNodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  @ViewChild('factorContainer') factorContainer: ElementRef;
  @ViewChild('dialogButton') dialogButton;

  public value: BehaviorSubject<string> = new BehaviorSubject<string>('');
  title = 'Adding authorization path';
  factors = [];
  uploading = false;
  cancel = new Subject<boolean>();
  isAuth = false;
  dialogFactorRef = null;
  private subscriptions = [];

  constructor(
    public dialog: MatDialog,
    private readonly router: Router,
    private readonly dds: DDSService,
    private readonly notification: NotificationService,
    private readonly keychain: KeyChainService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );
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
  }

  goBottom() {
    const container = $('#factor-container');
    const height = document.getElementById('factor-container').scrollHeight;
    container.animate({scrollTop: height}, 500, 'swing');
  }

  async generateLogin(isQr) {
    try {
      do {
        this.value.next('');
        const loginBytes = await randomBytes(32, this.workerService.worker);
        const exists = await this.dds.exists(loginBytes.toString('hex'));
        console.log(`FactorNodeComponent.generateLogin 1: loginBytes=${loginBytes}, isQr=${isQr}, exists=${exists}`);
        console.log('FactorNodeComponent.generateLogin 2:', loginBytes);
        if (!exists) {
          const packedLogin = await packLogin(loginBytes, this.workerService.worker);
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
      this.notification.show('DDS is unavailable');
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
      data: {isAuth: this.isAuth, label: label, isColored: true, isShadowed: true},
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

    }
  }

  async addFactor(result) {
    // try {
    //   switch (result.factor) {
    //     case FactorType.QR: {
    //       if (this.isAuth) {
    //         await this.authService.addFactor(result.factor, Buffer.from(result.value, 'hex'));
    //       } else {
    //         await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
    //       }
    //       break;
    //     }
    //     case FactorType.NFC: {
    //       if (this.isAuth) {
    //         await this.authService.addFactor(result.factor, result.value);
    //       } else {
    //         await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
    //       }
    //       break;
    //     }
    //     case FactorType.LOGIN: {
    //       console.log(`login=${result.value}, login to id=${result.value.toLowerCase()}`);
    //       await this.authService.addFactor(result.factor, await packLogin(result.value.toLowerCase(), this.workerService.worker));
    //       break;
    //     }
    //     default: {
    //       await this.authService.addFactor(result.factor, Buffer.from(result.value, 'utf-8'));
    //     }
    //   }
    //   this.goBottom();
    // } catch (e) {
    //   console.log(e);
    // }
  }

  async removeFactor(factor) {
    // this.authService.rmFactorWithChildren(factor);
    // this.factors = this.authService.factors;
    // this.changeDetectorRef.detectChanges();
  }

  async onSaveClicked() {
    try {
      this.uploading = true;

      console.log(this.factors);
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

      const login = (await tryUnpackLogin(idFactor, this.workerService.worker)).toString('utf-8');
      console.log(login);
      const id = await this.authService.toId(login);
      console.log(`FactorNodeComponent.onSaveClicked: login=${login}`);
      const data = await packTree(tree, this.keychain.getSeed(), this.workerService.worker);
      // this.authService.currentTree = data;
      //
      // try {
      //   const success = await this.dds.sponsorStore(id, data).pipe(take(1), takeUntil(this.cancel)).toPromise();
      //   if (!success) {
      //     await this.router.navigate(['/backup', { back: 'factor-node', next: 'wallet' }]);
      //     return;
      //   }
      //
      //   this.authService.clearFactors();
      //   this.authService.password = '';
      //   this.authService.currentTree = null;
      //   this.factors = [];
      //
      //   this.notification.show('Successfully uploaded the secret');
      //   await this.router.navigate(['/navigator', {outlets: {navigator: ['wallet']}}]);
      // } catch (ignored) {
      //     await this.router.navigate(['/backup', { back: 'factor-node', next: 'wallet' }]);
      // }
    } finally {
      this.uploading = false;
    }
  }

  async onBackClicked() {
    this.cancel.next(true);
    if (this.dialogFactorRef != null) {
      this.dialogFactorRef.close();
      this.dialogFactorRef = null;
    } else {
      await this.router.navigate(['/navigator', {outlets: {navigator: ['settings']}}]);
    }
  }
}
