import { Component } from '@angular/core';
import { BcoinComponent } from '../bcoin/bcoin';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  message = new BcoinComponent().test();
}
