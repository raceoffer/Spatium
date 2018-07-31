import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { getCurrencyLogo } from '../../utils/currency-icon';
import { BalanceStatus, Status } from '../../services/wallet/currencywallet';

@Component({
  selector: 'app-tile-coin',
  templateUrl: './tile-coin.component.html',
  styleUrls: ['./tile-coin.component.css']
})
export class TileCoinComponent implements OnInit {
  @HostBinding('class') classes = 'tile-coin';

  @Input() tileModel: any = {};

  @Output() clicked: EventEmitter<any> = new EventEmitter<any>();

  logo = '';
  public stateType = Status;
  public balanceStateType = BalanceStatus;
  ethereum = '';

  constructor() { }

  ngOnInit() {
    this.ethereum = getCurrencyLogo('ethereum');
    this.logo = getCurrencyLogo(this.tileModel.logo);
  }

  onClick() {
    this.clicked.next(this.tileModel.coin);
  }
}
