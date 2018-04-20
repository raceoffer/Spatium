import {Component, HostBinding, NgZone, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../../services/navigation.service';

declare const nfc: any;

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
  private subscriptions = [];

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

  constructor(private readonly ngZone: NgZone,
              private readonly router: Router,
              private readonly navigationService: NavigationService) { }

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
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    await  this.router.navigate(['/navigator-verifier', { outlets: { 'navigator': ['verify-transaction'] } }]);
  }

  toggleContent(content) {
    this.buttonState = State.Empty;
    this.content = content;
    this.incorrectSecret = 'hide';
  }

  async setEmpty() {
    this.buttonState = State.Empty;
    this.incorrectSecret = 'hide';
  }

  async setInput(input: string) {
    console.log(input);
    this.input = input;
    await this.checkInput(this.input);
  }

  async checkInput(input: string) {
    if (input !== '' && input !== null) {
      this.incorrectSecret = 'hide';
      this.buttonState = State.Import;
    } else {
      this.incorrectSecret = '';
      this.buttonState = State.Empty;
    }

  }

}
