import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.css']
})
export class RegistrationSuccessComponent implements OnInit {

  stSuccess0 = 'You have successfully created a secure,';
  stSuccess1 = 'personal SPATIUM account!';
  stOpenWallet = 'Open wallet';

  constructor(
    private readonly router: Router
  ) { }

  ngOnInit() {
  }

  async goWaiting() {
    await this.router.navigate(['/waiting']);
  }
}
