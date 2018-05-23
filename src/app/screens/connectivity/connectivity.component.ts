import { Component, OnInit } from '@angular/core';
import { DiscoveryService, State } from '../../services/discovery.service';
import { SocketServerService } from '../../services/socketserver.service';
import { Subject } from 'rxjs/Subject';
import { SocketClientService, State as SocketState } from '../../services/socketclient.service';

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./connectivity.component.css']
})
export class ConnectivityComponent implements OnInit {
  public stateType: any = State;
  public socketState: any = SocketState;
  public socket: WebSocket = null;

  public message = new Subject<any>();

  constructor(
    public readonly discoveryService: DiscoveryService,
    public readonly socketserverService: SocketServerService,
    public readonly socketclientService: SocketClientService
  ) {
    this.socketserverService.message.subscribe(console.log);
    this.socketclientService.message.subscribe(console.log);

    this.socketserverService.connectedEvent.subscribe(() => {
      this.socketserverService.send({ text: 'hello from server' });
    });

    this.socketclientService.connectedEvent.subscribe(() => {
      this.socketclientService.send({ text: 'hello from client' });
    });
  }

  ngOnInit() {}

  async startAdvertising() {
    await this.discoveryService.startAdvertising();
    await this.socketserverService.start();
  }

  async stopAdvertising() {
    await this.discoveryService.stopAdvertising();
    await this.socketserverService.stop();
  }

  async startDiscovery() {
    await this.discoveryService.startDiscovery();
  }

  async stopDiscovery() {
    await this.discoveryService.stopDiscovery();
  }

  async connectTo(ip, ignored) {
    await this.socketclientService.connect(ip);
  }
}
