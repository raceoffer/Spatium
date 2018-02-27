import { Component, OnInit } from '@angular/core';

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

  constructor() { }

  ngOnInit() {
    nfc.enabled(function () {}, function (e) {
      if (e === 'NO_NFC') {
        this.ngZone.run(async () => {
          this.isNfcAvailable = false;
        });
      }
    }.bind(this));
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
