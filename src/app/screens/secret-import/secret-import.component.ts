import { Component, OnInit } from '@angular/core';
import { FactorIcon, FactorIconAsset } from '../../services/auth.service';

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

  types = [
    {
      name: Content.NFC,
      icon: FactorIcon.NFC,
      icon_asset: FactorIconAsset.NFC
    },
    {
      name: Content.QR,
      icon: FactorIcon.QR,
      icon_asset: FactorIconAsset.QR
    }
  ];

  _selectedType: any;

  contentType = Content;

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
    this.selectedType = this.types[0];
  }

  get selectedType() {
    return this._selectedType;
  }

  set selectedType(newUserName) {
    this._selectedType = newUserName;
    console.log(this._selectedType);
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
