import { Component } from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';
import { ConnectionState, State } from '../../../services/primitives/state';

@Component({
  selector: 'app-confirmation-bluetooth-manage',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css', '../connectivity-manage.css']
})
export class BluetoothComponent {
  public stateType = State;
  public connectionStateType = ConnectionState;

  public connectedDevice = this.bt.connectedDevice;
  public state = this.bt.state;
  public connectionState = this.bt.connectionState;
  public listeningState = this.bt.listeningState;
  public discoveryState = this.bt.discoveryState;

  constructor(private readonly bt: BluetoothService) { }

  async toggleProvider(event) {
    // event.source.checked = this.toggled.getValue() || this.connected.getValue();
    // event.checked = event.source.checked;
  }

  async enableDiscovery() {
    await this.bt.enableDiscovery();
  }

}
