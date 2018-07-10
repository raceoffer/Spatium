import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../../../services/bluetooth.service';

@Component({
  selector: 'app-confirmation-bluetooth-manage',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css', '../connectivity-manage.css']
})
export class BluetoothComponent implements OnInit {

  connectedDevices = this.bt.connectedDevices;
  connected = this.bt.connected;
  listening = this.bt.listening;
  discoverable = this.bt.discoverable;
  toggled = this.bt.toggled;
  enabling = this.bt.enabling;
  stopped = this.bt.stopped;
  enabled = this.bt.enabled;
  starting = this.bt.starting;
  stopping = this.bt.stopping;

  constructor(private readonly bt: BluetoothService) { }

  ngOnInit() { }

  async toggleProvider(event) {
    // overwrite default event result
    event.source.checked = this.toggled.getValue() || this.connected.getValue();
    event.checked = event.source.checked;

    await this.bt.toggleProvider();
  }

  enableDiscovery() {
    this.bt.enableDiscovery();
  }

}
