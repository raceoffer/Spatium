import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.css']
})
export class EntryComponent implements OnInit {
  entry = 'Войти';
  stLogin = 'Логин';
  login = '';
  isDisable = false;

  constructor() { }

  ngOnInit() {
  }



  letLogin(): void {
    this.isDisable = !this.isDisable;
  }

}
