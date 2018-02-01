import { Component } from '@angular/core';

enum Content {
  Login,
  QR,
  NFC
}

@Component({
  selector: 'app-login-parent',
  templateUrl: './login-parent.component.html',
  styleUrls: ['./login-parent.component.css']
})
export class LoginParentComponent {
  contentType = Content;
  content = Content.Login;

  constructor() { }

  toggleContent(content) {
    this.content = content;
    switch (this.content) {
      case Content.Login: {
        break;
      }
      case Content.QR: {
        break;
      }
      case Content.NFC: {
        break;
      }
    }
  }

}
