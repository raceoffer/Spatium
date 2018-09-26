import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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

  @Input() isVerifyMode: boolean;

  stateType = State;
  deviceState = this.bt.deviceState;
  hasPermission = this.bt.hasPermission;
  discovering = this.bt.discovering;
  discoverable = this.bt.discoverable;

  constructor(
    private readonly bt: BluetoothService
  ) { }

  async ngOnInit() { }

  async ngOnDestroy() {
  }

  async enableBluetooth() {
    await this.bt.enable();
  }

  async grantPermission() {
    await this.bt.grantPermission();
  }

  async enableDiscovery() {
    await this.bt.enableDiscovery();
  }
}
