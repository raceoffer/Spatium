import {Component, Input, OnInit, Output, EventEmitter, HostBinding} from '@angular/core';

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

  constructor() { }

  ngOnInit() {
  }

  onClick(coin) {
    this.onClicked.emit(coin);
  }
}
