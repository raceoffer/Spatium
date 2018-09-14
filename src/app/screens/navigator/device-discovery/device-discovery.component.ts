import { Component, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { toBehaviourSubject } from '../../../utils/transformers';
import { SsdpService } from '../../../services/ssdp.service';
import { NavigationService } from '../../../services/navigation.service';
import { Device } from '../../../services/primitives/device';
import { RPCConnectionService } from '../../../services/rpc/rpc-connection.service';
import { SyncService } from '../../../services/sync.service';
import { KeyChainService } from '../../../services/keychain.service';

@Component({
  selector: 'app-device-discovery',
  templateUrl: './device-discovery.component.html',
  styleUrls: ['./device-discovery.component.css']
})
export class DeviceDiscoveryComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes = 'toolbars-component overlay-background';

  public devices: BehaviorSubject<Device[]> = toBehaviourSubject(this.ssdp.devices.pipe(
      map(d => Array.from(d.values()))
  ), []);

  constructor(
    private readonly ssdp: SsdpService,
    private readonly navigationService: NavigationService,
    private readonly connectionService: RPCConnectionService,
    private readonly syncService: SyncService,
    private readonly keyChainService: KeyChainService,
  ) { }

  async ngOnInit() {
    await this.startDiscovery();
  }

  async ngOnDestroy() {
    await this.ssdp.stop();
  }
  
  onBack() {
    this.navigationService.back();
  }

  async startDiscovery() {
    this.ssdp.reset();
    await this.ssdp.searchDevices();
  }

  async connectTo(device: Device) {
    await this.connectionService.connectPlain(device.ip, device.port);

    const capabilities = await this.connectionService.rpcClient.api.capabilities({});
    console.log(capabilities);

    await this.syncService.sync(
      this.keyChainService.sessionId,
      this.keyChainService.paillierPublicKey,
      this.keyChainService.paillierSecretKey,
      this.connectionService.rpcClient
    );

    console.log('Synchronized');
  }
}
