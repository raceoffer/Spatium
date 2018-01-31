import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-parent',
  templateUrl: './login-parent.component.html',
  styleUrls: ['./login-parent.component.css']
})
export class LoginParentComponent implements OnInit {

  currentType = 0;

  constructor() { }

  ngOnInit() {
  }

  toggleContent(type) {
    this.currentType = type;
    switch (type) {
      case 0: {
        break;
      }
      case 1: {
        break;
      }
      case 2: {
        break;
      }
    }
  }

}
