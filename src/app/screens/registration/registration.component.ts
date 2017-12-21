import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {

  login = 'adas';
  stLogin = 'Логин';
  stButton = 'Зарегистрироваться';

  constructor() { }

  ngOnInit() {
  }

}
