import { Component, OnInit } from '@angular/core';
import { ConnectivityService } from '../../../services/connectivity.service';

@Component({
  selector: 'app-confirmation-zeroconf-manage',
  templateUrl: './zeroconf.component.html',
  styleUrls: ['./zeroconf.component.css', '../connectivity-manage.css']
})
export class ZeroconfComponent implements OnInit {

  connectedDevices = this.connectivityService.connectedDevices;
  connected = this.connectivityService.connected;
  listening = this.connectivityService.listening;
  discoverable = this.connectivityService.discoverable;
  toggled = this.connectivityService.toggled;
  stopped = this.connectivityService.stopped;
  enabled = this.connectivityService.enabled;
  starting = this.connectivityService.starting;
  stopping = this.connectivityService.stopping;

  constructor(private readonly connectivityService: ConnectivityService) { }

  ngOnInit() {
  }

  async toggleProvider(event) {
    // overwrite default event result
    event.source.checked = this.toggled.getValue() || this.connected.getValue();
    event.source.disabled = (this.starting.getValue() || this.stopping.getValue());
    event.checked = event.source.checked;

    await this.connectivityService.toggleProvider();
  }

  networkSettings() {
    this.connectivityService.goToNetworkSettings();
  }

}
