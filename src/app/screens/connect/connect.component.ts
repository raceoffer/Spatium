import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {

  stConnect = 'Подключение';
  busyClass = 'fade-background invisible';

  devices = [
    {
      name: 'Photos',
      address: 'nkjhsd,asjd;laskdlakslkdfgsdgdsgdrg',
    },
    {
      name: 'Recipes',
      address: 'nkjhsd,asjd;laskdlakslk',
    },
    {
      name: 'Work',
      address: 'nkjhsd,asjd',
    }
  ];


  constructor() { }

  ngOnInit() {
  }

  toDo(event): void {
    console.log(JSON.stringify(event));
  }

}
