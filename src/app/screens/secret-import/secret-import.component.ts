import { Component, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { NavigationService } from '../../services/navigation.service';
import { NotificationService } from '../../services/notification.service';

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
  selector: 'app-secret-remove',
  templateUrl: './secret-import.component.html',
  styleUrls: ['./secret-import.component.css']
})
export class SecretImportComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component';

  isScanInProgress = false;
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

  private subscriptions = [];

  constructor(private readonly router: Router,
              private readonly ngZone: NgZone,
              private readonly fs: FileService,
              private readonly authService: AuthService,
              private readonly notification: NotificationService,
              private readonly navigationService: NavigationService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.navigationService.backEvent.subscribe(async () => {
        await this.onBackClicked();
      })
    );

    nfc.enabled(() => {}, e => {
      if (e === 'NO_NFC' || e === 'NO_NFC_OR_NFC_DISABLED') {
        this.ngZone.run(() => {
          this.isNfcAvailable = false;
        });
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  async onBackClicked() {
    console.log('onBackClicked in secret-import');
    console.log('isScanInProgress');
    console.log(this.isScanInProgress);
    if (this.isScanInProgress) {
      this.isScanInProgress = false;
      this.setEmpty();
      return;
    }

    await this.router.navigate(['/confirmation-entry', { back: 'start' }]);
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
    await this.checkInput();
  }

  async setIsScanInProgress() {
    this.isScanInProgress = true;
  }

  async checkInput() {
    if (this.input !== '' && this.input !== null) {
      this.incorrectSecret = 'hide';
      this.ngZone.run(async () => {
        this.buttonState = State.Import;
      });
    } else {
      this.incorrectSecret = '';
      this.ngZone.run(async () => {
        this.buttonState = State.Empty;
      });
    }
  }

  async overwriteSeed() {
    console.log(this.input);
    await this.fs.writeFile(this.fs.safeFileName('seed'), this.input);
    // this.authService.encryptedSeed = this.input;
    this.notification.show('Secret is imported successfully');
    this.isScanInProgress = false;
    await this.onBackClicked();
  }
}
