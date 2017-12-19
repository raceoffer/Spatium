import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css', '../../app.component.css']
})
export class MainComponent implements OnInit {
  title = 'Spatium Wallet app';
  message = 'Loading...';
  navLinks = [{
      name: 'Кошелек',
      link: '.',
    },
    {
      name: 'ICO',
      link: '.',
    },
    {
      name: 'Портфельное инвестирование',
      link: '.',
    },
    {
      name: 'Верификация',
      link: '.',
    },
    {
      name: 'Настройки',
      link: '.',
    }];

  constructor() {
  }

  ngOnInit() {
  }

}
