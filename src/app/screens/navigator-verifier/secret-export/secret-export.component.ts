import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NavigationService } from '../../../services/navigation.service';
import { WorkerService } from '../../../services/worker.service';

declare const nfc: any;

import { packSeed } from 'crypto-core-async/lib/utils';

enum Content {
  QR = 'QR',
  NFC = 'NFC'
}

enum State {
  Empty,
  Import
}

@Component({
  selector: 'app-secret-export',
  templateUrl: './secret-export.component.html',
  styleUrls: ['./secret-export.component.css']
})
export class SecretExportComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';
  title = 'Export secret';
  contentType = Content;
  content = Content.QR;
  stateType = State;
  buttonState = State.Empty;
  stSignUp = 'Sign up';
  stLogIn = 'Sign in';
  stError = 'Retry';
  incorrectSecret = 'hide';
  qrGenerate = null;
  input = '';
  isNfcAvailable = true;
  secretValue = '';
  packSeed = null;
  private subscriptions = [];

  constructor(
    private readonly ngZone: NgZone,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService,
    private readonly workerService: WorkerService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    nfc.enabled(function () {}, function (e) {
      if (e === 'NO_NFC' || (this.isWindows() && e === 'NO_NFC_OR_NFC_DISABLED')) {
        this.ngZone.run(async () => {
          this.isNfcAvailable = false;
        });
      }
    }.bind(this));

    this.writeSecret();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    await  this.router.navigate(['/navigator-verifier', {outlets: {'navigator': ['main']}}]);
  }

  toggleContent(content) {
    this.secretValue = null;
    this.buttonState = State.Empty;
    this.content = content;
    this.incorrectSecret = 'hide';

    this.switchSecretValue();
  }

  async writeSecret() {
    // const encryptedSeed = this.authService.encryptedSeed;
    // const buffesSeed = Buffer.from(encryptedSeed, 'hex');
    // this.packSeed = await packSeed(buffesSeed, this.workerService.worker);
    // this.switchSecretValue();

    console.log(this.secretValue);
  }

  switchSecretValue() {
    switch (this.content) {
      case this.contentType.QR: {
        this.secretValue = this.packSeed.toString('hex');
        break;
      }
      case this.contentType.NFC: {
        this.secretValue = this.packSeed;
        break;
      }
    }
  }

}
