import { Component, OnInit } from '@angular/core';
import { ConnectivityService, ServerState, ConnectionState } from '../../services/connectivity.service';

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./connectivity.component.css']
})
export class ConnectivityComponent implements OnInit {
  public stateType: any = ServerState;
  public socketState: any = ConnectionState;

  constructor(
    public readonly connectivityService: ConnectivityService
  ) {
    this.connectivityService.message.subscribe(console.log);

    this.connectivityService.connectedEvent.subscribe(() => {
      console.log('Fuckin\' connected');
    });
  }

  ngOnInit() {}

  async startAdvertising() {
    await this.connectivityService.startListening();
  }

  async stopAdvertising() {
    await this.connectivityService.stopListening();
  }

  async searchDevices() {
    await this.connectivityService.searchDevices(5 * 1000);
  }

  async connectTo(ip, ignored) {
    await this.connectivityService.connect(ip);
  }

  sendHello() {
    this.connectivityService.send({ text: 'hello you' });
  }
}
