import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { getCurrencyLogo } from '../../utils/currency-icon';

@Component({
  selector: 'app-tile-coin',
  templateUrl: './tile-coin.component.html',
  styleUrls: ['./tile-coin.component.css']
})
export class TileCoinComponent implements OnInit {
  @HostBinding('class') classes = 'tile-coin';

  @Input() coin: any = {};
  @Input() balanceInfo: any = {};
  @Input() synchronizing = false;

  @Output() onClicked: EventEmitter<any> = new EventEmitter<any>();

  logo = '';
  ethereum = '';

  constructor() { }

  ngOnInit() {
    this.ethereum = getCurrencyLogo('ethereum');
    this.logo = getCurrencyLogo(this.coin.logo);
  }

  onClick(coin) {
    this.onClicked.emit(coin);
  }
}
