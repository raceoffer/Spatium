import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-waiting',
  templateUrl: './waiting.component.html',
  styleUrls: ['./waiting.component.css']
})
export class WaitingComponent implements OnInit {
  Label = 'Ожидание подключения';
  connect = 'Подключиться'
  disabledBT = true;
  addressLoc = 'lkasjdksajdlaskdalskjkjlaow9q902';

  constructor() { }

  ngOnInit() {
  }

  changeBtState(): void {
    this.disabledBT = ! this.disabledBT;
  }

}
