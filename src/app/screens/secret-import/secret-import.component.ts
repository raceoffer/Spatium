import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FileService } from '../../services/file.service';
import {NotificationService} from '../../services/notification.service';
import {AuthService} from '../../services/auth.service';

declare const Utils: any;
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
export class SecretImportComponent implements OnInit {
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

  constructor(private readonly router: Router,
              private readonly fs: FileService,
              private readonly authService: AuthService,
              private readonly notification: NotificationService) { }

  ngOnInit() {
    nfc.enabled(function () {}, function (e) {
      if (e === 'NO_NFC') {
        this.ngZone.run(async () => {
          this.isNfcAvailable = false;
        });
      }
    }.bind(this));
  }

  async onBack() {
    await this.router.navigate(['/factor', { back: 'start' }, { outlets: { 'factor': ['pincode', { next: 'waiting' }] } }]);
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

  async checkInput() {
    if (this.input !== '' && this.input !== null) {
      this.incorrectSecret = 'hide';
      this.buttonState = State.Import;
    } else {
      this.incorrectSecret = '';
      this.buttonState = State.Empty;
    }

  }

  async overwriteSeed() {
    console.log(this.input);
    await this.fs.writeFile(this.fs.safeFileName('seed'), this.input);
    this.authService.encryptedSeed = this.input;
    this.notification.show('Secret is imported successfully');
    this.onBack();
  }

}
