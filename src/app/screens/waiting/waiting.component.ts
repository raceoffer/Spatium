import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit {
  Label = 'Ожидание подключения';
  connect = 'Подключиться'
  disabledBT = true;

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
    },
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
    },
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

  constructor(private router: Router) { }

  ngOnInit() {
  }

  changeBtState(): void {
    this.disabledBT = ! this.disabledBT;
  }

  toDo(name, address): void {
    console.log(JSON.stringify(name));
    console.log(JSON.stringify(address));
    this.router.navigate(['/connect'], { queryParams: { name: name, address: address } });
  }

  sddNewDevice(): void{

  }

}
