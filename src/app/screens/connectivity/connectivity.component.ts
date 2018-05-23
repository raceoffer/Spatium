import { Component, OnInit } from '@angular/core';
import { ConnectivityService, State } from '../../services/connectivity.service';

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./connectivity.component.css']
})
export class ConnectivityComponent implements OnInit {
  public stateType: any = State;

  constructor(public readonly connectivityService: ConnectivityService) {}

  ngOnInit() {}

  async startAdvertising() {
    await this.connectivityService.startAdvertising();
  }

  async stopAdvertising() {
    await this.connectivityService.stopAdvertising();
  }

  async startDiscovery() {
    await this.connectivityService.startDiscovery();
  }

  async stopDiscovery() {
    await this.connectivityService.stopDiscovery();
  }
}
