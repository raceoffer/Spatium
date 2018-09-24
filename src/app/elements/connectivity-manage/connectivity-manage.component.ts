import { Component, OnDestroy, OnInit} from '@angular/core';
import { BluetoothService } from '../../services/bluetooth.service';
import { BehaviorSubject } from 'rxjs/Rx';

@Component({
  selector: 'app-connectivity-manage',
  templateUrl: './connectivity-manage.component.html',
  styleUrls: ['./connectivity-manage.component.css']
})
export class ConnectivityManageComponent implements OnInit, OnDestroy {

  public isBtSupported: BehaviorSubject<boolean> = this.bt.supported;

  constructor(private readonly bt: BluetoothService) {
  }

  ngOnInit() { }

  ngOnDestroy() { }
}
