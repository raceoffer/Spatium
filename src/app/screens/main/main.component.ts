import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css', '../../app.component.css']
})
export class MainComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';
  logo_src = ''//'../../res/drawable/logo.svg';

  constructor() { }

  ngOnInit() {
  }

}
