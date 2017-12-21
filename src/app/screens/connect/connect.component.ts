import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {

  stConnect = 'Подключение';
  stText = 'Данное устройство успешно подключено. При совершении транзакционных операций вам будут выдаваться предупреждения';


  constructor() { }

  ngOnInit() {
  }

}
