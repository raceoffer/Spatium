import { Component, OnDestroy, OnInit } from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';
import { State } from '../../../services/primitives/state';
import { toBehaviourSubject } from '../../../utils/transformers';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-bluetooth-manage',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css', '../connectivity-manage.css']
})
export class BluetoothComponent implements OnInit, OnDestroy {

  stateType = State;
  deviceState = this.bt.deviceState;

  enabled: BehaviorSubject<boolean> = toBehaviourSubject(this.bt.deviceState.pipe(map(state => state === State.Started)), false);

  constructor(
    private readonly bt: BluetoothService
  ) { }

  async ngOnInit() {
    await this.bt.startServer();
  }

  async ngOnDestroy() {
  }

  async enableBluetooth() {
    await this.bt.enable();
  }

  async enableDiscovery() {
    await this.bt.enableDiscovery();
  }
}
