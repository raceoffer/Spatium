import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

declare const window: any;
declare const cordova: any;

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  async onOpenClicked() {
    this.router.navigate(['/login']);
  }

  async onConnectClicked() {
    this.router.navigate(['/pincode', { next: 'waiting' }]);
  }
}
